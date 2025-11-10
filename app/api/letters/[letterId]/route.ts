import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Letter from '@/model/Letter';
import LetterRead from '@/model/LetterRead';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * 获取信件详情
 */
export async function GET(req: NextRequest, context: { params: Promise<{ letterId: string }> }) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { letterId } = await context.params;

  try {
    const letter = await Letter.findOne({ 
      letterId,
      isPublished: true,
    }).lean() as any;

    if (!letter) {
      return NextResponse.json({ message: '信件不存在或未发布' }, { status: 404 });
    }

    // 获取当前用户ID（如果有）
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = token ? verifyAccessToken(token) : null;
    const userId = payload?.userId || null;

    // 如果用户已登录，标记为已读
    if (userId) {
      try {
        await LetterRead.findOneAndUpdate(
          { userId, letterId },
          { readAt: new Date() },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error('[letters] 标记已读失败:', error);
        // 继续执行，不影响信件查看
      }
    }

    // 增加查看次数
    await Letter.findOneAndUpdate(
      { letterId },
      { $inc: { viewCount: 1 } }
    );

    return NextResponse.json({ letter: { ...letter, viewCount: (letter.viewCount || 0) + 1 } });
  } catch (error) {
    console.error('[letters] 获取信件详情失败:', error);
    return NextResponse.json({ message: '获取信件详情失败' }, { status: 500 });
  }
}

