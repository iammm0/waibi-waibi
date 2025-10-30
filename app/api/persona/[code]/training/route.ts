import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import TrainingSample from '@/model/TrainingSample';

export async function POST(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  const { code: rawCode } = await context.params;
  const code = rawCode.toLowerCase();
  const body = await req.json();
  const input = (body?.input || '').trim();
  const response = (body?.response || '').trim();
  const scenario = (body?.scenario || '').trim() || undefined;
  if (!input || !response) return NextResponse.json({ message: '缺少必要字段' }, { status: 400 });

  try { await connectToDatabase(); } catch { return NextResponse.json({ message: '数据库连接失败' }, { status: 500 }); }

  const doc = await TrainingSample.create({
    userId: payload.userId,
    personaCode: code,
    input,
    response,
    scenario,
  });
  return NextResponse.json({ ok: true, id: doc._id });
}

export async function GET(req: NextRequest, context: { params: Promise<{ code: string }> }) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  const { code: rawCode } = await context.params;
  const code = rawCode.toLowerCase();
  try { await connectToDatabase(); } catch { return NextResponse.json({ items: [] }); }
  const items = await TrainingSample.find({ userId: payload.userId, personaCode: code }).sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ items });
}


