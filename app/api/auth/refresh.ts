import { NextApiRequest, NextApiResponse } from 'next';
import { verifyRefreshToken, signAccessToken } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: '缺少刷新令牌' });

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return res.status(401).json({ message: '刷新令牌无效' });

  const accessToken = signAccessToken({ userId: payload.userId, username: payload.username, email: payload.email });
  return res.status(200).json({ accessToken, tokenType: 'Bearer' });
}
