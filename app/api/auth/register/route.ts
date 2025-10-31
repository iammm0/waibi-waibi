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

  const { email, phone, password, confirmPassword } = await req.json();
  if (!email || !password || !confirmPassword) {
    return NextResponse.json({ message: '邮箱与密码必填' }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ message: '两次密码不一致' }, { status: 400 });
  }

  // 检查重复：只检查非空的邮箱和手机号，用户名允许重复
  const duplicateConditions: any[] = [];
  if (email) duplicateConditions.push({ email });
  if (phone) duplicateConditions.push({ phone });
  
  if (duplicateConditions.length > 0) {
    const exists = await User.findOne({ $or: duplicateConditions });
    if (exists) return NextResponse.json({ message: '该邮箱或手机号已被注册' }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const userId = `u_${Date.now()}`;
  const user = await User.create({ userId, name: email.split('@')[0], email, phone: phone || undefined, passwordHash: hash });

  const payload = { userId: user.userId, username: user.username, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return NextResponse.json({ user: { userId: user.userId, username: user.username, email: user.email, avatarUrl: user.avatarUrl }, accessToken, refreshToken, tokenType: 'Bearer' }, { status: 201 });
}
