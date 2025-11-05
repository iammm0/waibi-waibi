import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import TrainingSample from '@/model/TrainingSample';

/**
 * 导入微信聊天记录并转换为训练样本
 * 支持多种微信聊天记录格式
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { chatData, personaCode } = await req.json();

  if (!chatData || !personaCode) {
    return NextResponse.json({ message: '缺少必要参数' }, { status: 400 });
  }

  try {
    let messages: Array<{ role: string; content: string; time?: string }> = [];

    // 尝试解析不同的微信聊天记录格式
    if (Array.isArray(chatData)) {
      // 格式1: 直接是消息数组
      messages = chatData;
    } else if (chatData.messages && Array.isArray(chatData.messages)) {
      // 格式2: 包含messages字段
      messages = chatData.messages;
    } else if (chatData.chats && Array.isArray(chatData.chats)) {
      // 格式3: 包含chats数组，每个chat有messages
      messages = chatData.chats.flatMap((chat: any) => 
        Array.isArray(chat.messages) ? chat.messages : []
      );
    } else if (chatData.data && Array.isArray(chatData.data)) {
      // 格式4: 包含data字段
      messages = chatData.data;
    } else {
      return NextResponse.json({ message: '无法识别的聊天记录格式' }, { status: 400 });
    }

    if (messages.length === 0) {
      return NextResponse.json({ message: '聊天记录为空' }, { status: 400 });
    }

    // 处理消息，转换为训练样本
    const samples: Array<{ userId: string; personaCode: string; input: string; response: string; scenario?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    // 将消息按对话分组（连续的用户消息和AI回复）
    const conversations: Array<{ user: string; assistant: string }> = [];
    let currentUserMsg = '';
    let currentAssistantMsg = '';

    for (const msg of messages as any[]) {
      const role = msg.role || msg.type || '';
      const content = msg.content || msg.text || msg.message || '';

      if (!content || typeof content !== 'string') {
        failedCount++;
        continue;
      }

      // 识别用户消息（可能是"用户"、"我"、"user"等）
      if (role === 'user' || role === '我' || role === '用户' || msg.isSend === true || msg.isSend === 1) {
        // 如果之前有助手回复，先保存对话
        if (currentUserMsg && currentAssistantMsg) {
          conversations.push({
            user: currentUserMsg.trim(),
            assistant: currentAssistantMsg.trim(),
          });
        }
        currentUserMsg = content;
        currentAssistantMsg = '';
      } 
      // 识别AI/助手回复（可能是"assistant"、"AI"、"对方"等）
      else if (role === 'assistant' || role === 'AI' || role === '对方' || msg.isSend === false || msg.isSend === 0) {
        currentAssistantMsg += (currentAssistantMsg ? '\n' : '') + content;
      }
    }

    // 保存最后一组对话
    if (currentUserMsg && currentAssistantMsg) {
      conversations.push({
        user: currentUserMsg.trim(),
        assistant: currentAssistantMsg.trim(),
      });
    }

    // 创建训练样本
    for (const conv of conversations) {
      if (conv.user && conv.assistant && conv.user.length > 0 && conv.assistant.length > 0) {
        try {
          await TrainingSample.create({
            userId: payload.userId,
            personaCode: personaCode.toLowerCase(),
            input: conv.user,
            response: conv.assistant,
            scenario: '从微信聊天记录导入',
          });
          successCount++;
        } catch (err) {
          console.error('创建训练样本失败:', err);
          failedCount++;
        }
      } else {
        failedCount++;
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      total: messages.length,
      samplesCreated: successCount,
    });
  } catch (error: any) {
    console.error('[import-wechat] 导入失败:', error);
    return NextResponse.json({ 
      message: error?.message || '导入失败，请检查文件格式' 
    }, { status: 500 });
  }
}

