import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import UserPrompt from '@/model/UserPrompt';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  const code = params.code.toLowerCase();
  const { text } = await req.json();
  if (!text || typeof text !== 'string') return NextResponse.json({ message: '缺少内容' }, { status: 400 });

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  await UserPrompt.create({ userId: payload.userId, personaCode: code, text });
  return NextResponse.json({ ok: true });
}
