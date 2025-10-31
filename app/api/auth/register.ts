import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await connectToDatabase();
  } catch (e) {
    return res.status(500).json({ message: '数据库连接失败' });
  }

  const { email, phone, password, confirmPassword } = req.body as {
    email: string; phone?: string; password: string; confirmPassword: string;
  };

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ message: '邮箱与密码必填' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: '两次密码不一致' });
  }

  // 检查重复：只检查非空的邮箱和手机号，用户名允许重复
  const duplicateConditions: any[] = [];
  if (email) duplicateConditions.push({ email });
  if (phone) duplicateConditions.push({ phone });
  
  if (duplicateConditions.length > 0) {
    const exists = await User.findOne({ $or: duplicateConditions });
    if (exists) {
      return res.status(409).json({ message: '该邮箱或手机号已被注册' });
    }
  }

  const hash = await bcrypt.hash(password, 10);
  const userId = `u_${Date.now()}`;

  const user = await User.create({
    userId,
    name: email.split('@')[0],
    email,
    phone: phone || undefined,
    passwordHash: hash,
  });

  const payload = { userId: user.userId, username: user.username, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return res.status(201).json({
    user: { userId: user.userId, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    accessToken,
    refreshToken,
    tokenType: 'Bearer'
  });
}
