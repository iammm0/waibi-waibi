import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }
  const user = await User.findOne({ userId: payload.userId }, { passwordHash: 0 }).lean() as any;
  if (!user) return NextResponse.json({ message: '用户不存在' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });
  
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const body = await req.json();
  const {
    username, name, email, phone, profileVisibility,
    bio, birthday, gender, location, occupation, company,
    interests, website, socialLinks, education, skills,
    tags, signature, mbtiType, languages, about
  } = body;

  const updateData: any = {};
  
  // 处理基本字段 - 空字符串转换为null
  if (username !== undefined) updateData.username = username && username.trim() ? username.trim() : null;
  if (name !== undefined) updateData.name = name && name.trim() ? name.trim() : null;
  if (email !== undefined) updateData.email = email && email.trim() ? email.trim() : null;
  if (phone !== undefined) updateData.phone = phone && phone.trim() ? phone.trim() : null;
  if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
  
  // 新增的个人信息字段 - 空字符串转换为null
  if (bio !== undefined) updateData.bio = bio && bio.trim() ? bio.trim() : null;
  if (birthday !== undefined) {
    if (birthday && typeof birthday === 'string' && birthday.trim()) {
      try {
        updateData.birthday = new Date(birthday);
      } catch (e) {
        updateData.birthday = null;
      }
    } else {
      updateData.birthday = null;
    }
  }
  if (gender !== undefined) {
    // 如果gender是空字符串，设置为null
    updateData.gender = (gender && gender.trim() && gender !== '') ? gender : null;
  }
  if (location !== undefined) updateData.location = location && location.trim() ? location.trim() : null;
  if (occupation !== undefined) updateData.occupation = occupation && occupation.trim() ? occupation.trim() : null;
  if (company !== undefined) updateData.company = company && company.trim() ? company.trim() : null;
  if (interests !== undefined) {
    // 过滤掉空字符串
    if (Array.isArray(interests)) {
      updateData.interests = interests.filter((item: any) => item && item.trim());
    } else {
      updateData.interests = [];
    }
  }
  if (website !== undefined) updateData.website = website && website.trim() ? website.trim() : null;
  if (socialLinks !== undefined) {
    // 检查socialLinks是否为空对象或所有字段都为空
    if (socialLinks && typeof socialLinks === 'object') {
      // 清理空字符串
      const cleanedLinks: any = {};
      if (socialLinks.github && socialLinks.github.trim()) cleanedLinks.github = socialLinks.github.trim();
      if (socialLinks.twitter && socialLinks.twitter.trim()) cleanedLinks.twitter = socialLinks.twitter.trim();
      if (socialLinks.linkedin && socialLinks.linkedin.trim()) cleanedLinks.linkedin = socialLinks.linkedin.trim();
      if (socialLinks.instagram && socialLinks.instagram.trim()) cleanedLinks.instagram = socialLinks.instagram.trim();
      if (socialLinks.weibo && socialLinks.weibo.trim()) cleanedLinks.weibo = socialLinks.weibo.trim();
      if (socialLinks.douban && socialLinks.douban.trim()) cleanedLinks.douban = socialLinks.douban.trim();
      if (socialLinks.bilibili && socialLinks.bilibili.trim()) cleanedLinks.bilibili = socialLinks.bilibili.trim();
      if (socialLinks.custom && Array.isArray(socialLinks.custom) && socialLinks.custom.length > 0) {
        cleanedLinks.custom = socialLinks.custom.filter((link: any) => link.name && link.url);
      }
      
      const hasAnyLink = Object.keys(cleanedLinks).length > 0;
      updateData.socialLinks = hasAnyLink ? cleanedLinks : null;
    } else {
      updateData.socialLinks = null;
    }
  }
  if (education !== undefined) {
    // 清理education数组，移除所有字段都为空的对象
    if (Array.isArray(education)) {
      updateData.education = education.filter((edu: any) => 
        edu && (edu.school || edu.major || edu.degree || edu.graduationYear)
      );
    } else {
      updateData.education = [];
    }
  }
  if (skills !== undefined) {
    // 过滤掉空字符串
    if (Array.isArray(skills)) {
      updateData.skills = skills.filter((item: any) => item && item.trim());
    } else {
      updateData.skills = [];
    }
  }
  if (tags !== undefined) {
    // 过滤掉空字符串
    if (Array.isArray(tags)) {
      updateData.tags = tags.filter((item: any) => item && item.trim());
    } else {
      updateData.tags = [];
    }
  }
  if (signature !== undefined) updateData.signature = signature && signature.trim() ? signature.trim() : null;
  if (mbtiType !== undefined) updateData.mbtiType = mbtiType && mbtiType.trim() ? mbtiType.trim() : null;
  if (languages !== undefined) {
    // 过滤掉空字符串
    if (Array.isArray(languages)) {
      updateData.languages = languages.filter((item: any) => item && item.trim());
    } else {
      updateData.languages = [];
    }
  }
  if (about !== undefined) updateData.about = about && about.trim() ? about.trim() : null;

  // 使用 $set 操作符确保正确更新
  try {
    const user = await User.findOneAndUpdate(
      { userId: payload.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash').lean() as any;

    if (!user) return NextResponse.json({ message: '用户不存在' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('[api/auth/me] 更新用户信息失败:', error);
    return NextResponse.json(
      { message: '更新失败', error: error.message },
      { status: 500 }
    );
  }
}