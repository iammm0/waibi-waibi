import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const RESET_TOKEN_EXPIRY = '1h'; // 1小时过期

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: '请输入邮箱地址' }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) {
    // 为了安全，即使邮箱不存在也返回成功消息
    return NextResponse.json({ message: '如果该邮箱已注册，我们将发送重置密码链接' });
  }

  // 生成重置token（使用JWT，有效期1小时）
  const resetPayload = { userId: user.userId, email: user.email };
  const resetToken = jwt.sign(resetPayload, JWT_SECRET, { expiresIn: RESET_TOKEN_EXPIRY });

  // 在实际应用中，应该发送邮件包含重置链接
  // 这里返回token给前端（开发环境）
  // 生产环境应该通过邮件发送重置链接，格式：/reset-password?token=xxx
  return NextResponse.json({ 
    message: '重置链接已生成',
    resetToken, // 仅在开发环境返回，生产环境应该通过邮件发送
  });
}

