import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import PaymentOrder from '@/model/PaymentOrder';
import crypto from 'crypto';

/**
 * 创建支付订单
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

  const { plan, paymentMethod } = await req.json();

  if (!plan || plan !== 'monthly') {
    return NextResponse.json({ message: '无效的订阅计划' }, { status: 400 });
  }

  if (!paymentMethod || !['wechat', 'alipay'].includes(paymentMethod)) {
    return NextResponse.json({ message: '无效的支付方式' }, { status: 400 });
  }

  // 检查是否已有待支付的订单
  const existingOrder = await PaymentOrder.findOne({
    userId: payload.userId,
    status: 'pending',
  }).lean() as any;

  if (existingOrder) {
    return NextResponse.json({
      message: '您已有待支付的订单',
      orderId: existingOrder.orderId,
      paymentUrl: existingOrder.paymentUrl,
      testMode: true, // 测试模式
    });
  }

  try {
    // 生成订单号
    const orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const amount = 2000; // 20元 = 2000分

    // 测试模式：直接返回体验版本
    if (process.env.PAYMENT_TEST_MODE === 'true' || !process.env.WECHAT_APPID || !process.env.ALIPAY_APPID) {
      return NextResponse.json({
        orderId,
        testMode: true,
        message: '测试模式：体验版本已激活',
      });
    }

    // 正式模式：创建支付订单
    let paymentUrl = '';
    
    if (paymentMethod === 'wechat') {
      // TODO: 调用微信支付API创建订单
      // 这里需要配置微信支付商户信息
      // 暂时返回测试二维码
      paymentUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`wechat://pay?order=${orderId}`)}`;
    } else if (paymentMethod === 'alipay') {
      // TODO: 调用支付宝API创建订单
      // 这里需要配置支付宝商户信息
      // 暂时返回测试二维码
      paymentUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`alipays://platformapi/startapp?saId=10000007&qrcode=${orderId}`)}`;
    }

    // 创建订单记录
    const order = await PaymentOrder.create({
      orderId,
      userId: payload.userId,
      plan,
      amount,
      paymentMethod,
      status: 'pending',
      paymentUrl,
    });

    return NextResponse.json({
      orderId: order.orderId,
      paymentUrl: order.paymentUrl,
      testMode: false,
    });
  } catch (error: any) {
    console.error('[payment] 创建订单失败:', error);
    return NextResponse.json({ message: error?.message || '创建订单失败' }, { status: 500 });
  }
}

