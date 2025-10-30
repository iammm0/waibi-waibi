import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import Interaction from '@/model/Interaction';

export async function GET(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { code: rawCode } = await context.params;
  const code = rawCode.toLowerCase();
  const items = await Interaction.find({ userId: payload.userId, personaCode: code })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();
  // 隐藏 system 提示词消息，不返回给前端
  const sanitized = items.map((it: any) => ({
    ...it,
    messages: Array.isArray(it.messages) ? it.messages.filter((m: any) => m.role !== 'system') : [],
  }));
  return NextResponse.json({ items: sanitized });
}
