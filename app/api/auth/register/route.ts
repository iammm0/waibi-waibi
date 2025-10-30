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

  const { username, email, phone, password, confirmPassword, avatarUrl } = await req.json();
  if (!username || !password || !confirmPassword) {
    return NextResponse.json({ message: '用户名与密码必填' }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ message: '两次密码不一致' }, { status: 400 });
  }

  const exists = await User.findOne({ $or: [ { username }, email ? { email } : {}, phone ? { phone } : {} ] });
  if (exists) return NextResponse.json({ message: '用户已存在' }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const userId = `u_${Date.now()}`;
  const user = await User.create({ userId, name: username, username, email, phone, avatarUrl, passwordHash: hash });

  const payload = { userId: user.userId, username: user.username, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return NextResponse.json({ user: { userId: user.userId, username: user.username, email: user.email, avatarUrl: user.avatarUrl }, accessToken, refreshToken, tokenType: 'Bearer' }, { status: 201 });
}
