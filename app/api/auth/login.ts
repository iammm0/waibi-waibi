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

  const { identifier, password } = req.body as { identifier: string; password: string };
  if (!identifier || !password) return res.status(400).json({ message: '缺少登录信息' });

  const user = await User.findOne({
    $or: [ { username: identifier }, { email: identifier }, { phone: identifier } ]
  });
  if (!user || !user.passwordHash) return res.status(401).json({ message: '账号或密码错误' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: '账号或密码错误' });

  const payload = { userId: user.userId, username: user.username, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return res.status(200).json({
    user: { userId: user.userId, username: user.username, email: user.email, avatarUrl: user.avatarUrl },
    accessToken,
    refreshToken,
    tokenType: 'Bearer'
  });
}
