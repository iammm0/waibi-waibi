import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Message from '@/model/Message';
import { verifyAccessToken } from '@/lib/jwt';
import User from '@/model/User';
import { initGuestbook } from '@/lib/init-guestbook';

// 获取留言列表（随机展示）
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    // 首次访问时自动初始化留言板
    await initGuestbook();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  
  try {
    // 随机获取留言，最多返回limit条
    const messages = await Message.aggregate([
      { $sample: { size: limit } },
      { $sort: { createdAt: -1 } }
    ]);

    // 格式化返回数据
    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      content: msg.content,
      personaCode: msg.personaCode,
      username: msg.isAnonymous ? '匿名用户' : (msg.username || '匿名用户'),
      isAnonymous: msg.isAnonymous,
      isSystem: msg.isSystem,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('[guestbook] 获取留言失败:', error);
    return NextResponse.json({ message: '获取留言失败' }, { status: 500 });
  }
}

// 提交留言
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const body = await req.json();
  const { personaCode, content, isAnonymous } = body;

  if (!personaCode || !content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ message: '人格和留言内容必填' }, { status: 400 });
  }

  if (content.trim().length > 500) {
    return NextResponse.json({ message: '留言内容不能超过500字' }, { status: 400 });
  }

  // 验证用户身份（可选，匿名留言不需要token）
  let userId: string | undefined;
  let username: string | undefined;
  
  if (!isAnonymous) {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = token ? verifyAccessToken(token) : null;
    
    if (payload && payload.userId) {
      userId = payload.userId;
      // 获取用户名
      try {
        const user = await User.findOne({ userId: payload.userId }).lean();
        if (user) {
          username = user.username || user.name || '用户';
        }
      } catch (error) {
        console.error('[guestbook] 获取用户信息失败:', error);
      }
    }
  }

  try {
    const message = await Message.create({
      userId: isAnonymous ? undefined : userId,
      username: isAnonymous ? undefined : username,
      personaCode: personaCode.toLowerCase(),
      content: content.trim(),
      isAnonymous: isAnonymous || false,
      isSystem: false,
    });

    return NextResponse.json({ 
      message: { 
        id: message._id.toString(),
        content: message.content,
        personaCode: message.personaCode,
        username: message.isAnonymous ? '匿名用户' : (message.username || '匿名用户'),
        isAnonymous: message.isAnonymous,
        createdAt: message.createdAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('[guestbook] 提交留言失败:', error);
    return NextResponse.json({ message: '提交留言失败' }, { status: 500 });
  }
}

