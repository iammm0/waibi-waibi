import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import PaymentOrder from '@/model/PaymentOrder';
import User from '@/model/User';

/**
 * 处理支付回调的通用函数
 */
async function handlePaymentCallback(orderId: string, tradeNo: string | null, paymentMethod: string, status: string | null) {
  try {
    await connectToDatabase();
  } catch {
    return NextResponse.json({ message: '数据库连接失败' }, { status: 500 });
  }

  if (!orderId || !paymentMethod) {
    return NextResponse.json({ message: '缺少必要参数' }, { status: 400 });
  }

  try {
    // 查找订单
    const order = await PaymentOrder.findOne({ orderId }).lean() as any;
    if (!order) {
      return NextResponse.json({ message: '订单不存在' }, { status: 404 });
    }

    // 如果订单已处理，直接返回成功
    if (order.status === 'paid') {
      return NextResponse.json({ ok: true, message: '订单已处理' });
    }

    // 验证支付状态
    if (status !== 'success' && status !== 'paid') {
      // 支付失败
      await PaymentOrder.findOneAndUpdate(
        { orderId },
        { $set: { status: 'failed' } }
      );
      return NextResponse.json({ ok: false, message: '支付失败' });
    }

    // TODO: 验证支付签名（微信/支付宝）
    // 这里需要根据实际支付平台配置进行签名验证
    // 暂时跳过验证，直接处理

    // 更新订单状态
    await PaymentOrder.findOneAndUpdate(
      { orderId },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
          ...(paymentMethod === 'wechat' ? { wechatTradeNo: tradeNo } : {}),
          ...(paymentMethod === 'alipay' ? { alipayTradeNo: tradeNo } : {}),
        },
      }
    );

    // 激活用户订阅
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 一个月后

    await User.findOneAndUpdate(
      { userId: order.userId },
      {
        $set: {
          subscription: {
            active: true,
            plan: order.plan,
            startDate,
            endDate,
            price: order.amount / 100, // 转换为元
          },
        },
      }
    );

    return NextResponse.json({ ok: true, message: '支付成功' });
  } catch (error: any) {
    console.error('[payment] 支付回调处理失败:', error);
    return NextResponse.json({ message: error?.message || '处理失败' }, { status: 500 });
  }
}

/**
 * 支付回调处理（微信/支付宝）- POST请求
 */
export async function POST(req: NextRequest) {
  const { orderId, tradeNo, paymentMethod, status } = await req.json();
  return handlePaymentCallback(orderId, tradeNo, paymentMethod, status);
}

/**
 * 微信支付回调（GET请求）
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const tradeNo = searchParams.get('tradeNo');
  const status = searchParams.get('status');
  const paymentMethod = searchParams.get('paymentMethod') || 'wechat';

  if (!orderId) {
    return NextResponse.json({ message: '缺少订单号' }, { status: 400 });
  }

  return handlePaymentCallback(orderId, tradeNo, paymentMethod, status);
}

