import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { identifier, password } = await req.json();
  if (!identifier || !password) return NextResponse.json({ message: '缺少登录信息' }, { status: 400 });

  const user = await User.findOne({ $or: [ { username: identifier }, { email: identifier }, { phone: identifier } ] });
  if (!user || !user.passwordHash) return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });

  const payload = { userId: user.userId, username: user.username, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return NextResponse.json({ user: { userId: user.userId, username: user.username, email: user.email, avatarUrl: user.avatarUrl }, accessToken, refreshToken, tokenType: 'Bearer' });
}
