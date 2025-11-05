import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * 获取用户的公开主页信息
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { username } = await context.params;
  const decodedUsername = decodeURIComponent(username);

  try {
    // 查找用户（通过username或name）
    const user = await User.findOne({
      $or: [
        { username: decodedUsername },
        { name: decodedUsername },
      ],
    }).lean() as any;

    if (!user) {
      return NextResponse.json({ message: '用户不存在' }, { status: 404 });
    }

    // 获取当前登录用户（如果有）
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = token ? verifyAccessToken(token) : null;
    const isOwnProfile = payload && payload.userId === user.userId;

    // 构建公开信息（根据profileVisibility）
    const visibility = user.profileVisibility || {};
    const publicProfile: any = {
      userId: user.userId,
    };

    // 根据可见性设置返回数据
    if (visibility.name === 'public' || isOwnProfile) {
      publicProfile.name = user.name;
    }
    if (visibility.username === 'public' || isOwnProfile) {
      publicProfile.username = user.username;
    }
    if (visibility.avatarUrl === 'public' || isOwnProfile) {
      publicProfile.avatarUrl = user.avatarUrl;
    }
    if (visibility.email === 'public' || isOwnProfile) {
      publicProfile.email = user.email;
    }
    if (visibility.phone === 'public' || isOwnProfile) {
      publicProfile.phone = user.phone;
    }

    return NextResponse.json({ user: publicProfile, isOwn: isOwnProfile });
  } catch (error) {
    console.error('[profile] 获取用户信息失败:', error);
    return NextResponse.json({ message: '获取用户信息失败' }, { status: 500 });
  }
}

