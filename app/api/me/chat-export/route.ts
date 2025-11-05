import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import Interaction from '@/model/Interaction';

/**
 * 导出用户聊天记录（JSON格式）
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  try {
    const interactions = await Interaction.find({ userId: payload.userId })
      .sort({ updatedAt: -1 })
      .lean();

    // 转换为微信聊天格式（简化版）
    const chatData = {
      exportTime: new Date().toISOString(),
      userId: payload.userId,
      totalChats: interactions.length,
      chats: interactions.map((interaction: any) => ({
        personaCode: interaction.personaCode,
        messages: interaction.messages
          .filter((m: any) => m.role !== 'system')
          .map((m: any) => ({
            role: m.role === 'user' ? '用户' : 'AI',
            content: m.content,
            time: m.createdAt || interaction.createdAt,
          })),
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
      })),
    };

    // 返回JSON，前端可以下载
    return NextResponse.json(chatData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chat-export-${payload.userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('[export] 导出聊天记录失败:', error);
    return NextResponse.json({ message: '导出聊天记录失败' }, { status: 500 });
  }
}

