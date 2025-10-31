import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';
import { verifyAccessToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { resetToken, newPassword, confirmPassword } = await req.json();
  if (!resetToken || !newPassword || !confirmPassword) {
    return NextResponse.json({ message: '缺少必要参数' }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: '两次输入的密码不一致' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ message: '密码长度至少为6位' }, { status: 400 });
  }

  // 验证重置token
  const payload = verifyAccessToken(resetToken);
  if (!payload || !payload.userId || !payload.email) {
    return NextResponse.json({ message: '重置链接无效或已过期' }, { status: 401 });
  }

  // 查找用户
  const user = await User.findOne({ userId: payload.userId, email: payload.email });
  if (!user) {
    return NextResponse.json({ message: '用户不存在' }, { status: 404 });
  }

  // 更新密码
  const hash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = hash;
  await user.save();

  return NextResponse.json({ message: '密码重置成功' });
}

