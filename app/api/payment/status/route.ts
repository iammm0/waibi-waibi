import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import PaymentOrder from '@/model/PaymentOrder';

/**
 * 查询支付订单状态
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

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ message: '缺少订单号' }, { status: 400 });
  }

  try {
    const order = await PaymentOrder.findOne({ 
      orderId,
      userId: payload.userId, // 确保只能查询自己的订单
    }).lean() as any;

    if (!order) {
      return NextResponse.json({ message: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.orderId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      amount: order.amount,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
    });
  } catch (error: any) {
    console.error('[payment] 查询订单状态失败:', error);
    return NextResponse.json({ message: error?.message || '查询失败' }, { status: 500 });
  }
}

