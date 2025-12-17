'use client';

import { useEffect, useState } from 'react';
import { useVibe } from '@/app/providers';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface UniverseToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const TOAST_TITLES = {
  success: { waibi: '操作成功！', rational: '操作成功' },
  error: { waibi: '宇宙信号中断', rational: '操作失败' },
  info: { waibi: '歪比频道消息', rational: '提示信息' },
  warning: { waibi: '宇宙警告', rational: '警告' },
};

function UniverseToast({ toast, onClose }: UniverseToastProps) {
  const { mode } = useVibe();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 触发动画
    setTimeout(() => setIsVisible(true), 10);
    
    // 自动关闭
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const containerClass = mode === 'waibi'
    ? 'bg-black/90 border border-gray-700 text-white shadow-lg shadow-gray-900/20'
    : 'bg-white border border-gray-200 text-gray-900 shadow-lg';
  
  const typeColors = {
    success: mode === 'waibi'
      ? 'border-gray-600/50 bg-gray-600/10 text-gray-300'
      : 'border-gray-300 bg-gray-50 text-gray-700',
    error: mode === 'waibi'
      ? 'border-red-500/50 bg-red-500/10 text-red-400'
      : 'border-red-300 bg-red-50 text-red-700',
    info: mode === 'waibi'
      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
      : 'border-blue-300 bg-blue-50 text-blue-700',
    warning: mode === 'waibi'
      ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
      : 'border-yellow-300 bg-yellow-50 text-yellow-700',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 min-w-[300px] max-w-md rounded-xl p-4 border transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      } ${containerClass} ${typeColors[toast.type]}`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm mb-1 ${
            mode === 'waibi' ? 'text-white' : 'text-gray-900'
          }`}>
            {TOAST_TITLES[toast.type][mode === 'waibi' ? 'waibi' : 'rational']}
          </div>
          <div className={`text-sm ${
            mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {toast.message}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(() => onClose(toast.id), 300);
          }}
          className={`flex-shrink-0 text-lg leading-none hover:opacity-70 transition-opacity ${
            mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Toast 管理器组件
export function UniverseToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // 监听全局 toast 事件
    const handleShowToast = (event: CustomEvent<Omit<Toast, 'id'>>) => {
      const newToast: Toast = {
        id: `toast-${Date.now()}-${Math.random()}`,
        ...event.detail,
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener('showUniverseToast' as any, handleShowToast as EventListener);
    return () => {
      window.removeEventListener('showUniverseToast' as any, handleShowToast as EventListener);
    };
  }, []);

  const handleClose = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 p-4">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <UniverseToast toast={toast} onClose={handleClose} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 工具函数：显示 Toast
export function showUniverseToast(
  type: ToastType,
  message: string,
  duration?: number
) {
  const event = new CustomEvent('showUniverseToast', {
    detail: { type, message, duration },
  });
  window.dispatchEvent(event);
}

// 便捷函数
export const universeToast = {
  success: (message: string, duration?: number) => showUniverseToast('success', message, duration),
  error: (message: string, duration?: number) => showUniverseToast('error', message, duration),
  info: (message: string, duration?: number) => showUniverseToast('info', message, duration),
  warning: (message: string, duration?: number) => showUniverseToast('warning', message, duration),
};

