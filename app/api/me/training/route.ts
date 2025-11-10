import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import TrainingSample from '@/model/TrainingSample';

/**
 * 获取用户所有训练样本
 */
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

  try {
    const samples = await TrainingSample.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ items: samples });
  } catch (error) {
    console.error('[training] 获取训练样本失败:', error);
    return NextResponse.json({ message: '获取训练样本失败' }, { status: 500 });
  }
}

/**
 * 删除训练样本
 */
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ message: '缺少样本ID' }, { status: 400 });

  try {
    const sample = await TrainingSample.findOneAndDelete({ 
      _id: id, 
      userId: payload.userId 
    });
    if (!sample) {
      return NextResponse.json({ message: '样本不存在或无权限' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[training] 删除训练样本失败:', error);
    return NextResponse.json({ message: '删除训练样本失败' }, { status: 500 });
  }
}

