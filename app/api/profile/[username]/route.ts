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
    // 新增的个人信息字段
    if ((visibility.bio === 'public' || isOwnProfile) && user.bio) {
      publicProfile.bio = user.bio;
    }
    if ((visibility.birthday === 'public' || isOwnProfile) && user.birthday) {
      publicProfile.birthday = user.birthday;
    }
    if ((visibility.gender === 'public' || isOwnProfile) && user.gender) {
      publicProfile.gender = user.gender;
    }
    if ((visibility.location === 'public' || isOwnProfile) && user.location) {
      publicProfile.location = user.location;
    }
    if ((visibility.occupation === 'public' || isOwnProfile) && user.occupation) {
      publicProfile.occupation = user.occupation;
    }
    if ((visibility.company === 'public' || isOwnProfile) && user.company) {
      publicProfile.company = user.company;
    }
    if ((visibility.interests === 'public' || isOwnProfile) && user.interests) {
      publicProfile.interests = user.interests;
    }
    if ((visibility.website === 'public' || isOwnProfile) && user.website) {
      publicProfile.website = user.website;
    }
    if ((visibility.socialLinks === 'public' || isOwnProfile) && user.socialLinks) {
      publicProfile.socialLinks = user.socialLinks;
    }
    if ((visibility.education === 'public' || isOwnProfile) && user.education) {
      publicProfile.education = user.education;
    }
    if ((visibility.skills === 'public' || isOwnProfile) && user.skills) {
      publicProfile.skills = user.skills;
    }
    if ((visibility.tags === 'public' || isOwnProfile) && user.tags) {
      publicProfile.tags = user.tags;
    }
    if ((visibility.signature === 'public' || isOwnProfile) && user.signature) {
      publicProfile.signature = user.signature;
    }
    if ((visibility.mbtiType === 'public' || isOwnProfile) && user.mbtiType) {
      publicProfile.mbtiType = user.mbtiType;
    }
    if ((visibility.languages === 'public' || isOwnProfile) && user.languages) {
      publicProfile.languages = user.languages;
    }
    if ((visibility.about === 'public' || isOwnProfile) && user.about) {
      publicProfile.about = user.about;
    }

    return NextResponse.json({ user: publicProfile, isOwn: isOwnProfile });
  } catch (error) {
    console.error('[profile] 获取用户信息失败:', error);
    return NextResponse.json({ message: '获取用户信息失败' }, { status: 500 });
  }
}

