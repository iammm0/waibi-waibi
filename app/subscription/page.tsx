'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import { fetchWithAuth } from '@/lib/auth-utils';
import SectionHeader from '@/components/section-header';
import { universeToast } from '@/components/universe-toast';
import { universeConfirm } from '@/components/universe-confirm';

interface Subscription {
  active: boolean;
  plan?: string;
  startDate?: string;
  endDate?: string;
  price?: number;
}

export default function SubscriptionPage() {
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-gray-900/50 text-white' : 'border border-gray-300 bg-white text-gray-900';

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<'wechat' | 'alipay' | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  // 轮询支付状态
  useEffect(() => {
    if (polling && orderId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetchWithAuth(`/api/payment/status?orderId=${orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'paid') {
              setPolling(false);
              setPaymentUrl(null);
              setOrderId(null);
              setSelectedPayment(null);
              await fetchSubscription();
              universeToast.success('支付成功！订阅已激活');
            } else if (data.status === 'failed' || data.status === 'cancelled') {
              setPolling(false);
              setPaymentUrl(null);
              setOrderId(null);
              setSelectedPayment(null);
              universeToast.error('支付失败或已取消');
            }
          }
        } catch (err) {
          console.error('查询支付状态失败:', err);
        }
      }, 3000); // 每3秒查询一次

      return () => clearInterval(interval);
    }
  }, [polling, orderId]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || { active: false, price: 20 });
      }
    } catch (err) {
      console.error('获取订阅状态失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (paymentMethod: 'wechat' | 'alipay') => {
    // 显示测试中提示
    const confirmed = await universeConfirm.confirm(
      '订阅功能正在测试中，暂时无法正常订阅。是否使用体验版本（免费激活）？',
      { type: 'info', title: '订阅功能测试中' }
    );
    if (!confirmed) {
      return;
    }

    setSelectedPayment(paymentMethod);
    
    try {
      const res = await fetchWithAuth('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'monthly',
          paymentMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // 测试模式：直接激活体验版本
        if (data.testMode) {
          await fetchWithAuth('/api/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: 'monthly', testMode: true }),
          });
          await fetchSubscription();
          universeToast.info('体验版本已激活！订阅功能正在测试中，正式版将支持微信支付和支付宝支付。');
          return;
        }

        // 正式模式：获取支付链接
        if (data.paymentUrl && data.orderId) {
          setPaymentUrl(data.paymentUrl);
          setOrderId(data.orderId);
          setPolling(true);
        } else {
          universeToast.error('创建订单失败，请重试');
        }
      } else {
        const errorData = await res.json();
        universeToast.error(errorData?.message || '创建订单失败');
      }
    } catch (err) {
      console.error('创建订单失败:', err);
      universeToast.error('创建订单失败，请重试');
    }
  };

  const handleCancelPayment = () => {
    setPaymentUrl(null);
    setOrderId(null);
    setSelectedPayment(null);
    setPolling(false);
  };

  const handleCancelSubscription = async () => {
    const confirmed = await universeConfirm.confirm(
      '确定要取消订阅吗？',
      { type: 'warning', title: '取消订阅' }
    );
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth('/api/subscription', {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchSubscription();
        universeToast.success('订阅已取消');
      } else {
        universeToast.error('取消订阅失败，请重试');
      }
    } catch (err) {
      universeToast.error('取消订阅失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-2 max-w-4xl">
        <SectionHeader icon="💎" title="订阅计划" subtitle="加载中..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-4xl">
      <SectionHeader icon="💎" title="订阅计划" subtitle="选择合适的订阅计划，解锁更多功能" />

      {/* 测试中提示 */}
      <div className={`rounded-xl p-4 mb-6 ${mode === 'waibi' ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-200' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'}`}>
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <div className="font-semibold mb-1">订阅功能正在测试中</div>
            <div className="text-sm opacity-90">
              目前订阅功能正在测试阶段，暂时无法正常支付。您可以选择体验版本免费激活订阅。
              正式版本将支持微信支付和支付宝支付，我们正在配置相关商户信息。
            </div>
          </div>
        </div>
      </div>

      {/* 订阅状态卡片 */}
      {subscription && (
        <div className={`rounded-xl shadow-md p-6 mb-6 ${panelClass}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">当前订阅状态</h2>
            <span className={`px-3 py-1 rounded-full text-xs ${
              subscription.active 
                ? mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                : mode === 'waibi' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
            }`}>
              {subscription.active ? '已激活' : '未激活'}
            </span>
          </div>
          {subscription.active ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold">¥{subscription.price || 20}/月</div>
              {subscription.endDate && (
                <div className="text-sm opacity-70">
                  到期时间: {new Date(subscription.endDate).toLocaleDateString('zh-CN')}
                </div>
              )}
              <button
                onClick={handleCancelSubscription}
                className={`mt-4 px-4 py-2 rounded-lg ${secondaryBtn}`}
              >
                取消订阅
              </button>
            </div>
          ) : (
            <div className="text-sm opacity-70">您还没有激活订阅</div>
          )}
        </div>
      )}

      {/* 订阅计划卡片 */}
      <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
        <h2 className="text-xl font-semibold mb-4">选择订阅计划</h2>
        
        <div className={`p-6 rounded-lg mb-6 ${mode === 'waibi' ? 'bg-gray-900/50 border border-green-500/30' : 'bg-gray-50 border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold mb-1">月付计划</div>
              <div className="text-sm opacity-70">按月订阅，随时取消</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">¥20</div>
              <div className="text-sm opacity-70">/月</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm font-medium mb-2">包含功能：</div>
            <ul className="space-y-1 text-sm opacity-80">
              <li>✓ 无限人格模型训练</li>
              <li>✓ 无限聊天记录</li>
              <li>✓ 优先技术支持</li>
              <li>✓ 专属功能优先体验</li>
            </ul>
          </div>

          {!paymentUrl ? (
            <div className="space-y-3">
              <button
                onClick={() => handleCreateOrder('wechat')}
                className={`w-full px-6 py-3 rounded-lg text-white ${accentBtn} flex items-center justify-center gap-2 relative`}
              >
                <span>微信支付</span>
                <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs ${
                  mode === 'waibi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  开发中
                </span>
              </button>
              <button
                onClick={() => handleCreateOrder('alipay')}
                className={`w-full px-6 py-3 rounded-lg text-white ${accentBtn} flex items-center justify-center gap-2 relative`}
              >
                <span>支付宝支付</span>
                <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs ${
                  mode === 'waibi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  开发中
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                <div className="text-sm mb-2">
                  请使用 {selectedPayment === 'wechat' ? '微信' : '支付宝'} 扫描二维码完成支付
                </div>
                {paymentUrl && (
                  <div className="flex justify-center mb-4">
                    <img src={paymentUrl} alt="支付二维码" className="w-48 h-48 border-2 border-gray-300" />
                  </div>
                )}
                <div className="text-xs opacity-70 text-center">
                  订单号: {orderId}
                </div>
              </div>
              <button
                onClick={handleCancelPayment}
                className={`w-full px-4 py-2 rounded-lg ${secondaryBtn}`}
              >
                取消支付
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

