import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  if (!refreshToken) return NextResponse.json({ message: '缺少刷新令牌' }, { status: 400 });
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return NextResponse.json({ message: '刷新令牌无效' }, { status: 401 });
  const accessToken = signAccessToken({ userId: payload.userId, username: payload.username, email: payload.email });
  return NextResponse.json({ accessToken, tokenType: 'Bearer' });
}
