import { createSqliteModel } from '@/lib/sqlite-model';

export interface PaymentOrder {
  _id?: string;
  orderId: string;
  userId: string;
  plan: string;
  amount: number;
  paymentMethod: 'wechat' | 'alipay';
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  wechatTradeNo?: string;
  alipayTradeNo?: string;
  paymentUrl?: string;
  callbackData?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
  paidAt?: Date | string;
}

const PaymentOrderModel = createSqliteModel<PaymentOrder>('payment_orders', {
  defaults: () => ({
    status: 'pending',
  }),
});

export default PaymentOrderModel;
