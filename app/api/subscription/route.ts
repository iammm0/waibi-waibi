import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import User from '@/model/User';

/**
 * 获取订阅状态
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
    const user = await User.findOne({ userId: payload.userId }).lean();
    if (!user) return NextResponse.json({ message: '用户不存在' }, { status: 404 });

    const subscription = (user as any).subscription || {
      active: false,
      plan: null,
      startDate: null,
      endDate: null,
      price: 20, // 每月20元
    };

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('[subscription] 获取订阅状态失败:', error);
    return NextResponse.json({ message: '获取订阅状态失败' }, { status: 500 });
  }
}

/**
 * 创建订阅（模拟支付）
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ message: '未授权' }, { status: 401 });

  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  const { plan, testMode } = await req.json();
  if (!plan || plan !== 'monthly') {
    return NextResponse.json({ message: '无效的订阅计划' }, { status: 400 });
  }

  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 一个月后

    await User.findOneAndUpdate(
      { userId: payload.userId },
      {
        $set: {
          subscription: {
            active: true,
            plan: 'monthly',
            startDate,
            endDate,
            price: 20,
            testMode: testMode || false, // 标记是否为测试模式
          },
        },
      }
    );

    return NextResponse.json({
      ok: true,
      subscription: {
        active: true,
        plan: 'monthly',
        startDate,
        endDate,
        price: 20,
        testMode: testMode || false,
      },
    });
  } catch (error) {
    console.error('[subscription] 创建订阅失败:', error);
    return NextResponse.json({ message: '创建订阅失败' }, { status: 500 });
  }
}

/**
 * 取消订阅
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

  try {
    await User.findOneAndUpdate(
      { userId: payload.userId },
      {
        $set: {
          'subscription.active': false,
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[subscription] 取消订阅失败:', error);
    return NextResponse.json({ message: '取消订阅失败' }, { status: 500 });
  }
}

