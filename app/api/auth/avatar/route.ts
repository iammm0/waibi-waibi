import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  const { avatarUrl } = await req.json();
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return NextResponse.json({ message: '头像URL无效' }, { status: 400 });
  }

  const user = await User.findOneAndUpdate(
    { userId: payload.userId },
    { avatarUrl },
    { new: true }
  ).select('-passwordHash').lean();

  if (!user) return NextResponse.json({ message: '用户不存在' }, { status: 404 });

  return NextResponse.json({ user });
}

