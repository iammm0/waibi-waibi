'use client';

import { useState } from 'react';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';

export default function SupportPage() {
  const { mode } = useVibe();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const cardClass = mode === 'waibi' ? 'bg-gray-900/50 border border-gray-700 hover:border-gray-600' : 'bg-gray-50 border border-gray-200 hover:border-gray-300';
  const accentBtn = mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600';
  const accentClass = mode === 'waibi' ? 'text-gray-200' : 'text-gray-800';

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'alipay' | 'wechat' | null>(null);

  const amounts = [2, 3, 6, 10];

  // 收款码图片路径（用户需要上传到 public 目录）
  const paymentCodes = {
    alipay: '/payment-codes/alipay.png', // 支付宝收款码
    wechat: '/payment-codes/wechat.png', // 微信收款码
  };

  return (
    <div className="container mx-auto px-4 py-2 max-w-4xl">
      <SectionHeader 
        title="请开发者喝杯咖啡" 
        subtitle="您的支持将帮助我们持续运营和改进歪比宇宙" 
      />

      {/* 说明卡片 */}
      <div className={`rounded-xl shadow-md p-6 mb-6 ${panelClass}`}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-3">关于支持</h2>
            <div className="space-y-2 opacity-90 text-sm">
              <p>
                歪比宇宙是一个完全免费的项目，但运行需要消耗大量的 <strong className={accentClass}>AI Tokens</strong> 和 <strong className={accentClass}>算力资源</strong>。
              </p>
              <p>
                您的每一份支持都将直接用于：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>购买 AI API 的 Tokens，确保服务稳定运行</li>
                <li>支付服务器和算力成本，保证响应速度</li>
                <li>持续优化和改进网站功能</li>
                <li>维护和更新服务器基础设施</li>
              </ul>
              <p className="mt-3 pt-3 border-t border-opacity-20">
                <strong className={accentClass}>感谢您的支持！</strong> 每一份心意都是我们前进的动力。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 金额选择 */}
      <div className={`rounded-xl shadow-md p-6 mb-6 ${panelClass}`}>
        <h2 className="text-xl font-semibold mb-4">选择金额</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {amounts.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setSelectedPayment(null);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAmount === amount
                  ? mode === 'waibi'
                    ? 'border-gray-600 bg-gray-600/20 text-gray-200'
                    : 'border-gray-500 bg-gray-500/10 text-gray-800'
                  : cardClass
              }`}
            >
              <div className="text-2xl font-bold">¥{amount}</div>
              <div className="text-xs opacity-70 mt-1">一杯咖啡</div>
            </button>
          ))}
        </div>
      </div>

      {/* 支付方式选择 */}
      {selectedAmount && (
        <div className={`rounded-xl shadow-md p-6 mb-6 ${panelClass}`}>
          <h2 className="text-xl font-semibold mb-4">选择支付方式</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedPayment('alipay')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedPayment === 'alipay'
                  ? mode === 'waibi'
                    ? 'border-gray-600 bg-gray-600/20'
                    : 'border-gray-500 bg-gray-500/10'
                  : cardClass
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-semibold">支付宝</div>
                  <div className="text-xs opacity-70">使用支付宝扫码支付</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setSelectedPayment('wechat')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedPayment === 'wechat'
                  ? mode === 'waibi'
                    ? 'border-gray-600 bg-gray-600/20'
                    : 'border-gray-500 bg-gray-500/10'
                  : cardClass
              }`}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-semibold">微信支付</div>
                  <div className="text-xs opacity-70">使用微信扫码支付</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 收款码显示 */}
      {selectedAmount && selectedPayment && (
        <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold mb-2">
              请支付 ¥{selectedAmount}
            </h2>
            <p className="text-sm opacity-70">
              使用{selectedPayment === 'alipay' ? '支付宝' : '微信'}扫描下方二维码完成支付
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            {/* 收款码图片 */}
            <div className={`p-4 rounded-lg ${mode === 'waibi' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <img
                src={paymentCodes[selectedPayment]}
                alt={selectedPayment === 'alipay' ? '支付宝收款码' : '微信收款码'}
                className="w-64 h-64 object-contain border-2 border-gray-300 rounded"
                onError={(e) => {
                  // 如果图片加载失败，显示占位符
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = document.createElement('div');
                  placeholder.className = `w-64 h-64 flex items-center justify-center border-2 border-dashed rounded ${
                    mode === 'waibi' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-400'
                  }`;
                  placeholder.textContent = '收款码加载中...';
                  target.parentElement?.appendChild(placeholder);
                }}
              />
            </div>

            {/* 提示信息 */}
            <div className={`p-4 rounded-lg text-sm max-w-md ${
              mode === 'waibi' ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-200' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            }`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <div className="font-semibold mb-1">支付提示</div>
                  <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                    <li>请确认支付金额为 <strong>¥{selectedAmount}</strong></li>
                    <li>支付完成后，资金将用于购买 AI Tokens 和算力资源</li>
                    <li>感谢您的支持！</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedAmount(null);
                  setSelectedPayment(null);
                }}
                className={`px-6 py-2 rounded-lg ${
                  mode === 'waibi' 
                    ? 'border border-gray-700 bg-gray-800/50 hover:bg-gray-800' 
                    : 'border border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                重新选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 说明信息 */}
      {!selectedAmount && (
        <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
          <h3 className="text-lg font-semibold mb-3">💡 使用说明</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm opacity-90">
            <li>选择您想要支持的金额（2元、3元、6元或10元）</li>
            <li>选择支付方式（支付宝或微信）</li>
            <li>扫描显示的收款码完成支付</li>
            <li>您的支持将直接用于网站的运营和维护</li>
          </ol>
        </div>
      )}
    </div>
  );
}

