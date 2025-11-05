import mongoose, { Document, Schema } from 'mongoose';

export interface PaymentOrder extends Document {
  orderId: string; // 订单号（唯一）
  userId: string; // 用户ID
  plan: string; // 订阅计划
  amount: number; // 金额（分）
  paymentMethod: 'wechat' | 'alipay'; // 支付方式
  status: 'pending' | 'paid' | 'failed' | 'cancelled'; // 订单状态
  wechatTradeNo?: string; // 微信交易号
  alipayTradeNo?: string; // 支付宝交易号
  paymentUrl?: string; // 支付链接（二维码URL或跳转URL）
  callbackData?: any; // 回调数据
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date; // 支付完成时间
}

const paymentOrderSchema = new Schema<PaymentOrder>({
  orderId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  plan: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['wechat', 'alipay'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending', index: true },
  wechatTradeNo: { type: String },
  alipayTradeNo: { type: String },
  paymentUrl: { type: String },
  callbackData: { type: Schema.Types.Mixed },
  paidAt: { type: Date },
}, { timestamps: true });

const PaymentOrderModel = mongoose.models.PaymentOrder || mongoose.model<PaymentOrder>('PaymentOrder', paymentOrderSchema);
export default PaymentOrderModel;

