'use client';

import { useState } from 'react';
import { useVibe } from '@/app/providers';
import { useRouter } from 'next/navigation';

// 预设的模型列表
const DEFAULT_MODELS = [
  'gpt-4o-mini',            // OpenAI 轻量聊天
  'gpt-4.1-nano',          // Nano 级成本
  'gpt-4.1-mini',          // Mini 级性能/成本折中
  'deepseek-v3.1',         // DeepSeek 轻量聊天
  'deepseek-chat',         // DeepSeek 聊天稳定版
  'qwen-turbo',            // 阿里通义 Turbo 级
  'mistral-small-latest',  // Mistral 小型聊天
  'llama-3-8b',            // Meta 小参数聊天
  'glm-4.5-flash',         // 智谱轻量快推
];

interface ChatSidebarProps {
  instanceId: string;
  onInstanceChange: (id: string) => void;
  instances: any[];
  loadingInstances: boolean;
  model: string;
  onModelChange: (model: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ChatSidebar({
  instanceId,
  onInstanceChange,
  instances,
  loadingInstances,
  model,
  onModelChange,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const { mode } = useVibe();
  const router = useRouter();

  const sidebarClass = mode === 'waibi' 
    ? 'bg-black/95 border-r border-green-500/20 text-white shadow-lg' 
    : 'bg-white border-r border-gray-200 text-gray-900 shadow-sm';
  const inputClass = mode === 'waibi' 
    ? 'border border-green-500/30 bg-gray-900/50 text-white placeholder-gray-500' 
    : 'border border-gray-300 bg-white text-gray-900 placeholder-gray-400';
  const buttonClass = mode === 'waibi'
    ? 'bg-gray-800/80 hover:bg-gray-700 text-white border border-green-500/20'
    : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200';
  const headerClass = mode === 'waibi'
    ? 'bg-gradient-to-r from-green-500/10 to-transparent border-b border-green-500/20'
    : 'bg-gradient-to-r from-gray-50 to-transparent border-b border-gray-200';

  if (isCollapsed) {
    return (
      <div className={`${sidebarClass} w-14 flex flex-col items-center py-4 transition-all duration-300 h-full`}>
        <button
          onClick={onToggleCollapse}
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${buttonClass} transition-all hover:scale-105`}
          title="展开侧边栏"
        >
          <span className="text-lg">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`${sidebarClass} w-64 sm:w-72 flex flex-col transition-all duration-300 h-full`}>
      {/* 头部 */}
      <div className={`p-3 sm:p-4 flex items-center justify-between ${headerClass}`}>
        <h2 className="text-base sm:text-lg font-semibold">聊天设置</h2>
        <button
          onClick={onToggleCollapse}
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${buttonClass} transition-all hover:scale-105`}
          title="收起侧边栏"
        >
          <span className="text-lg">←</span>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* 模型实例选择 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-xs sm:text-sm font-medium ${mode === 'waibi' ? 'text-gray-200' : 'text-gray-700'}`}>
              选择模型实例
            </label>
            <button
              onClick={() => router.push('/persona-instance/create')}
              className={`text-xs px-2 py-1 rounded ${mode === 'waibi' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              + 新建
            </button>
          </div>
          {loadingInstances ? (
            <div className={`text-xs text-center py-4 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
              加载中...
            </div>
          ) : instances.length === 0 ? (
            <div className={`text-xs text-center py-4 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="mb-2">还没有创建模型实例</div>
              <button
                onClick={() => router.push('/persona-instance/create')}
                className={`px-3 py-1 rounded text-xs ${mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110'} text-white`}
              >
                立即创建
              </button>
            </div>
          ) : (
            <>
              <select
                className={`w-full p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-all ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500/50' : 'focus:ring-[var(--accent-cyan)]'}`}
                value={instanceId}
                onChange={(e) => onInstanceChange(e.target.value)}
              >
                {instances.map((instance) => (
                  <option key={instance._id} value={instance._id}>
                    {instance.name}
                  </option>
                ))}
              </select>
              {instances.find(i => i._id === instanceId) && (
                <p className={`text-xs mt-1 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {instances.find(i => i._id === instanceId)?.description || '无描述'}
                </p>
              )}
            </>
          )}
        </div>

        {/* 模型选择 */}
        <div>
          <label className={`block text-xs sm:text-sm font-medium mb-2 ${mode === 'waibi' ? 'text-gray-200' : 'text-gray-700'}`}>
            选择模型
          </label>
          <select
            className={`w-full p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-all ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500/50' : 'focus:ring-[var(--accent-cyan)]'}`}
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
          >
            {DEFAULT_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* 当前选择信息卡片 */}
        {instanceId && instances.find(i => i._id === instanceId) && (
          <div className={`p-3 sm:p-4 rounded-xl border ${mode === 'waibi' ? 'bg-gray-900/60 border-green-500/20' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`text-xs font-medium mb-2.5 ${mode === 'waibi' ? 'text-green-400' : 'text-gray-500'}`}>
              当前配置
            </div>
            <div className={`text-base font-semibold mb-1 ${mode === 'waibi' ? 'text-white' : 'text-gray-900'}`}>
              {instances.find(i => i._id === instanceId)?.name || '未知实例'}
            </div>
            <div className={`text-xs mb-2 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-600'}`}>
              {model}
            </div>
            {instances.find(i => i._id === instanceId)?.personaCode && (
              <div className={`text-xs px-2 py-1 rounded inline-block ${
                mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-700'
              }`}>
                {instances.find(i => i._id === instanceId)?.personaCode.toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

