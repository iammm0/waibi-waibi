import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Letter from '@/model/Letter';
import { initLetters } from '@/lib/init-letters';

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
    const letters = await Letter.find({ isPublished: true })
      .sort({ priority: -1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('-content') // 列表不返回完整内容
      .lean();

    const total = await Letter.countDocuments({ isPublished: true });

    return NextResponse.json({
      letters,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[letters] 获取信件列表失败:', error);
    return NextResponse.json({ message: '获取信件列表失败' }, { status: 500 });
  }
}

