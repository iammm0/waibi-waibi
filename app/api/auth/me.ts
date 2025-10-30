import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return res.status(401).json({ message: '未授权' });

  try {
    await connectToDatabase();
  } catch (e) {
    return res.status(500).json({ message: '数据库连接失败' });
  }

  const user = await User.findOne({ userId: payload.userId }, { passwordHash: 0 }).lean();
  if (!user) return res.status(404).json({ message: '用户不存在' });
  return res.status(200).json({ user });
}
