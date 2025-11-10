import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Message from '@/model/Message';
import { verifyAccessToken } from '@/lib/jwt';
import User from '@/model/User';
import { MBTI_TYPES } from '@/lib/mbti';

// 获取评论列表（随机展示，支持人格筛选）
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const personaCode = searchParams.get('personaCode'); // 可选的人格筛选
  
  try {
    // 构建查询条件
    const query: any = { parentId: { $exists: false } }; // 只获取顶级评论
    if (personaCode) {
      query.personaCode = personaCode.toLowerCase();
    }

    // 如果没有指定personaCode，返回所有留言（按时间倒序）
    // 如果指定了personaCode，只返回该人格的留言
    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean() as any[];

    // 获取每条评论的回复
    const formattedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        let avatarUrl: string | undefined;
        if (!msg.isAnonymous && msg.userId) {
          try {
            const user = await User.findOne({ userId: msg.userId }).lean() as any;
            if (user && user.avatarUrl) {
              avatarUrl = user.avatarUrl;
            }
          } catch (error) {
            // 忽略错误，继续处理
          }
        }

        // 递归获取所有回复（包括嵌套回复）
        const getAllReplies = async (parentMsgId: string): Promise<any[]> => {
          const directReplies = await Message.find({ parentId: parentMsgId })
            .sort({ createdAt: 1 })
            .lean() as any[];
          
          const formattedReplies = await Promise.all(
            directReplies.map(async (reply: any) => {
              let replyAvatarUrl: string | undefined;
              if (!reply.isAnonymous && reply.userId) {
                try {
                  const replyUser = await User.findOne({ userId: reply.userId }).lean() as any;
                  if (replyUser && replyUser.avatarUrl) {
                    replyAvatarUrl = replyUser.avatarUrl;
                  }
                } catch (error) {
                  // 忽略错误
                }
              }
              
              // 递归获取该回复的嵌套回复
              const nestedReplies = await getAllReplies(reply._id.toString());
              
              return {
                id: reply._id.toString(),
                content: reply.content,
                personaCode: reply.personaCode,
                username: reply.isAnonymous ? '匿名用户' : (reply.username || '匿名用户'),
                userId: reply.isAnonymous ? undefined : reply.userId,
                avatarUrl: replyAvatarUrl,
                isAnonymous: reply.isAnonymous,
                parentId: reply.parentId,
                replyToUserId: reply.replyToUserId,
                replyToUsername: reply.replyToUsername,
                createdAt: reply.createdAt,
                nestedReplies: nestedReplies,
              };
            })
          );
          
          return formattedReplies;
        };
        
        const formattedReplies = await getAllReplies(msg._id.toString());

        return {
          id: msg._id.toString(),
          content: msg.content,
          personaCode: msg.personaCode,
          username: msg.isAnonymous ? '匿名用户' : (msg.username || '匿名用户'),
          userId: msg.isAnonymous ? undefined : msg.userId,
          avatarUrl,
          isAnonymous: msg.isAnonymous,
          isSystem: msg.isSystem || false,
          createdAt: msg.createdAt,
          replies: formattedReplies,
          replyCount: formattedReplies.length,
        };
      })
    );

    return NextResponse.json({ 
      messages: formattedMessages,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('[guestbook] 获取评论失败:', error);
    return NextResponse.json({ message: '获取评论失败' }, { status: 500 });
  }
}

// 提交评论或回复（需要登录）
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  // 验证用户身份（必须登录）
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  
  if (!payload || !payload.userId) {
    return NextResponse.json({ message: '请先登录' }, { status: 401 });
  }

  const body = await req.json();
  const { personaCode, content, isAnonymous, parentId, replyToUserId, replyToUsername } = body;

  // 如果是回复，需要parentId
  if (parentId) {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ message: '回复内容必填' }, { status: 400 });
    }
  } else {
    // 如果是顶级评论，需要personaCode
    if (!personaCode || !content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ message: '人格和评论内容必填' }, { status: 400 });
    }
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ message: '内容不能超过500字' }, { status: 400 });
  }

  // 获取用户信息
  let userId: string = payload.userId;
  let username: string | undefined;
  
  try {
    const user = await User.findOne({ userId: payload.userId }).lean() as any;
    if (user) {
      username = user.username || user.name || '用户';
    }
  } catch (error) {
    console.error('[guestbook] 获取用户信息失败:', error);
  }

  try {
    // 如果是回复，需要验证父评论是否存在
    if (parentId) {
      const parentMessage = await Message.findById(parentId).lean() as any;
      if (!parentMessage) {
        return NextResponse.json({ message: '父评论不存在' }, { status: 404 });
      }
      // 回复时，personaCode继承自父评论
      const message = await Message.create({
        userId: isAnonymous ? undefined : userId,
        username: isAnonymous ? undefined : username,
        personaCode: parentMessage.personaCode,
        content: content.trim(),
        isAnonymous: isAnonymous || false,
        isSystem: false,
        parentId: parentId,
        replyToUserId: replyToUserId,
        replyToUsername: replyToUsername,
      });

      // 获取回复的用户头像
      let avatarUrl: string | undefined;
      if (!message.isAnonymous && message.userId) {
        try {
          const user = await User.findOne({ userId: message.userId }).lean() as any;
          if (user && user.avatarUrl) {
            avatarUrl = user.avatarUrl;
          }
        } catch (error) {
          // 忽略错误
        }
      }

      return NextResponse.json({ 
        message: { 
          id: message._id.toString(),
          content: message.content,
          personaCode: message.personaCode,
          username: message.isAnonymous ? '匿名用户' : (message.username || '匿名用户'),
          userId: message.isAnonymous ? undefined : message.userId,
          avatarUrl,
          isAnonymous: message.isAnonymous,
          parentId: message.parentId,
          replyToUserId: message.replyToUserId,
          replyToUsername: message.replyToUsername,
          createdAt: message.createdAt,
        }
      }, { status: 201 });
    } else {
      // 顶级评论
      const message = await Message.create({
        userId: isAnonymous ? undefined : userId,
        username: isAnonymous ? undefined : username,
        personaCode: personaCode.toLowerCase(),
        content: content.trim(),
        isAnonymous: isAnonymous || false,
        isSystem: false,
      });

      // 获取用户头像
      let avatarUrl: string | undefined;
      if (!message.isAnonymous && message.userId) {
        try {
          const user = await User.findOne({ userId: message.userId }).lean() as any;
          if (user && user.avatarUrl) {
            avatarUrl = user.avatarUrl;
          }
        } catch (error) {
          // 忽略错误
        }
      }

      return NextResponse.json({ 
        message: { 
          id: message._id.toString(),
          content: message.content,
          personaCode: message.personaCode,
          username: message.isAnonymous ? '匿名用户' : (message.username || '匿名用户'),
          userId: message.isAnonymous ? undefined : message.userId,
          avatarUrl,
          isAnonymous: message.isAnonymous,
          createdAt: message.createdAt,
          replies: [],
          replyCount: 0,
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('[guestbook] 提交评论失败:', error);
    return NextResponse.json({ message: '提交评论失败' }, { status: 500 });
  }
}

