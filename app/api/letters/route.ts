import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Letter from '@/model/Letter';
import LetterRead from '@/model/LetterRead';
import { initLetters } from '@/lib/init-letters';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * 获取信件列表
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    // 首次访问时自动初始化信件
    await initLetters();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // 获取当前用户ID（如果有）
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = token ? verifyAccessToken(token) : null;
    const userId = payload?.userId || null;

    const letters = await Letter.find({ isPublished: true })
      .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('-content') // 列表不返回完整内容
      .lean() as any[];

    const total = await Letter.countDocuments({ isPublished: true });

    // 如果用户已登录，获取已读状态
    let readLetterIds = new Set<string>();
    if (userId) {
      const readRecords = await LetterRead.find({ userId }).select('letterId').lean() as any[];
      readLetterIds = new Set(readRecords.map(r => r.letterId));
    }

    // 为每个信件添加未读标识
    const lettersWithReadStatus = letters.map(letter => ({
      ...letter,
      isRead: userId ? readLetterIds.has(letter.letterId) : false,
    }));

    return NextResponse.json({
      letters: lettersWithReadStatus,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[letters] 获取信件列表失败:', error);
    return NextResponse.json({ message: '获取信件列表失败' }, { status: 500 });
  }
}

