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

  const { username, email, phone, password, confirmPassword, avatarUrl } = req.body as {
    username: string; email?: string; phone?: string; password: string; confirmPassword: string; avatarUrl?: string;
  };

  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ message: '用户名与密码必填' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: '两次密码不一致' });
  }

  const exists = await User.findOne({ $or: [ { username }, email ? { email } : {}, phone ? { phone } : {} ] });
  if (exists) {
    return res.status(409).json({ message: '用户已存在' });
  }

  const hash = await bcrypt.hash(password, 10);
  const userId = `u_${Date.now()}`;

  const user = await User.create({
    userId,
    name: username,
    username,
    email,
    phone,
    avatarUrl,
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
