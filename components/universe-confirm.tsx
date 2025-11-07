'use client';

import { useEffect, useState } from 'react';
import { useVibe } from '@/app/providers';

interface ConfirmDialog {
  id: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

interface UniverseConfirmProps {
  dialog: ConfirmDialog;
  onClose: (id: string, confirmed: boolean) => void;
}

const CONFIRM_ICONS = {
  warning: '⚠️',
  danger: '💥',
  info: '📡',
};

const CONFIRM_TITLES = {
  warning: { waibi: '宇宙警告', rational: '警告' },
  danger: { waibi: '危险操作', rational: '危险操作' },
  info: { waibi: '歪比频道消息', rational: '提示信息' },
};

function UniverseConfirm({ dialog, onClose }: UniverseConfirmProps) {
  const { mode } = useVibe();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 触发动画
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const containerClass = mode === 'waibi'
    ? 'bg-black/90 border border-green-500/30 text-white shadow-lg shadow-green-500/20'
    : 'bg-white border border-gray-200 text-gray-900 shadow-lg';

  const typeColors = {
    warning: mode === 'waibi'
      ? 'border-yellow-500/50 bg-yellow-500/10'
      : 'border-yellow-300 bg-yellow-50',
    danger: mode === 'waibi'
      ? 'border-red-500/50 bg-red-500/10'
      : 'border-red-300 bg-red-50',
    info: mode === 'waibi'
      ? 'border-blue-500/50 bg-blue-500/10'
      : 'border-blue-300 bg-blue-50',
  };

  const confirmBtn = mode === 'waibi'
    ? dialog.type === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-green-500 hover:bg-green-600 text-white'
    : dialog.type === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-[var(--accent-cyan)] hover:brightness-110 text-white';

  const cancelBtn = mode === 'waibi'
    ? 'border border-gray-500/50 bg-gray-800/50 hover:bg-gray-800 text-gray-300'
    : 'border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700';

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(() => {
      dialog.onConfirm();
      onClose(dialog.id, true);
    }, 300);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      dialog.onCancel();
      onClose(dialog.id, false);
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleCancel}
    >
      <div
        className={`backdrop-blur-sm bg-black/50 absolute inset-0 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative rounded-xl p-6 max-w-md w-full mx-4 border transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4'
        } ${containerClass} ${typeColors[dialog.type || 'warning']}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="text-3xl flex-shrink-0">
            {CONFIRM_ICONS[dialog.type || 'warning']}
          </div>
          <div className="flex-1 min-w-0">
            {dialog.title && (
              <h3 className={`text-lg font-semibold mb-2 ${
                mode === 'waibi' ? 'text-white' : 'text-gray-900'
              }`}>
                {dialog.title}
              </h3>
            )}
            <p className={`text-sm ${
              mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {dialog.message}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${cancelBtn}`}
          >
            {dialog.cancelText || '取消'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${confirmBtn}`}
          >
            {dialog.confirmText || '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm 管理器组件
export function UniverseConfirmContainer() {
  const [dialogs, setDialogs] = useState<ConfirmDialog[]>([]);

  useEffect(() => {
    // 监听全局 confirm 事件
    const handleShowConfirm = (event: CustomEvent<ConfirmDialog & { resolve: (value: boolean) => void }>) => {
      const { resolve, ...dialogData } = event.detail;
      const newDialog: ConfirmDialog = {
        id: `confirm-${Date.now()}-${Math.random()}`,
        ...dialogData,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      };
      setDialogs((prev) => [...prev, newDialog]);
    };

    window.addEventListener('showUniverseConfirm' as any, handleShowConfirm as EventListener);
    return () => {
      window.removeEventListener('showUniverseConfirm' as any, handleShowConfirm as EventListener);
    };
  }, []);

  const handleClose = (id: string, confirmed: boolean) => {
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id);
      if (dialog) {
        if (confirmed) {
          dialog.onConfirm();
        } else {
          dialog.onCancel();
        }
      }
      return prev.filter((d) => d.id !== id);
    });
  };

  return (
    <>
      {dialogs.map((dialog) => (
        <UniverseConfirm key={dialog.id} dialog={dialog} onClose={handleClose} />
      ))}
    </>
  );
}

// 工具函数：显示 Confirm
export function showUniverseConfirm(
  message: string,
  options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  }
): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = {
      message,
      title: options?.title,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      type: options?.type || 'warning',
      resolve,
    };

    const event = new CustomEvent('showUniverseConfirm', {
      detail: dialog,
    });
    window.dispatchEvent(event);
  });
}

// 便捷函数（兼容原生 confirm API）
export const universeConfirm = {
  confirm: (message: string, options?: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  }) => showUniverseConfirm(message, options),
};

