'use client';

import { useState, useRef, useEffect } from 'react';
import { useVibe } from '@/app/providers';
import { getPersonaColors, getPersonaButtonClasses } from '@/lib/persona-colors';

// 预设的模型列表（与persona-chat保持一致）
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

interface TrainingPreviewProps {
  personaCode: string;
  personaName: string;
}

/**
 * 训练预览组件
 * 用于测试训练后的人格模型，不持久化聊天记录
 */
export default function TrainingPreview({ personaCode, personaName }: TrainingPreviewProps) {
  const { mode } = useVibe();
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      alert('请先登录后再进行此操作');
      return;
    }

    setLoading(true);
    const optimistic = [...messages, { role: 'user' as const, content: text }];
    setMessages(optimistic);
    setInput('');

    try {
      const { fetchWithAuth } = await import('@/lib/auth-utils');
      const res = await fetchWithAuth(`/api/persona/${personaCode}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model: model || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          alert('登录已过期，请重新登录');
          setMessages([...optimistic, { role: 'assistant', content: '登录已过期，请重新登录' }]);
        } else {
          throw new Error(data?.message || '发送失败');
        }
      } else {
        setMessages([...optimistic, { role: 'assistant', content: data.reply }]);
      }
    } catch (err: any) {
      setMessages([...optimistic, { role: 'assistant', content: `出错了：${err?.message || '未知错误'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  // 获取人格颜色
  const personaColors = personaCode ? getPersonaColors(personaCode.toUpperCase(), mode) : null;
  const accentBtnClasses = personaCode ? getPersonaButtonClasses(personaCode.toUpperCase(), mode) : (mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600');
  
  const panelClass = personaColors 
    ? (mode === 'waibi' ? `bg-black/90 ${personaColors.border} text-white` : `bg-white ${personaColors.border} text-gray-900`)
    : (mode === 'waibi' ? 'bg-black/90 border border-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-900');
  const inputClass = personaColors
    ? (mode === 'waibi' ? `${personaColors.border} bg-black text-white` : `${personaColors.border} bg-white text-gray-900`)
    : (mode === 'waibi' ? 'border border-gray-700 bg-black text-white' : 'border border-gray-300 bg-white text-gray-900');
  const accentBtn = personaColors ? accentBtnClasses : (mode === 'waibi' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600');
  const focusRing = personaColors ? personaColors.focus : (mode === 'waibi' ? 'focus:ring-gray-500/50' : 'focus:ring-gray-500');

  return (
    <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">预览训练效果</h3>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-700'}`}>模型</label>
          <select
            className={`rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 ${
              personaColors
                ? (mode === 'waibi' ? `${focusRing} bg-black text-white ${personaColors.border}` : `${focusRing} bg-white text-gray-900 ${personaColors.border}`)
                : (mode === 'waibi' ? 'focus:ring-gray-500/50 bg-black text-white border-gray-700' : 'focus:ring-gray-500 bg-white text-gray-900 border-gray-300')
            }`}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {DEFAULT_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className={`px-3 py-1 text-sm rounded ${mode === 'waibi' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 消息区 */}
      <div className={`rounded-lg border p-4 max-h-[400px] overflow-y-auto space-y-3 mb-4 ${
        personaColors
          ? (mode === 'waibi' ? `bg-gray-900/50 ${personaColors.border}` : `bg-gray-50 ${personaColors.border}`)
          : (mode === 'waibi' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200')
      }`}>
        {messages.length === 0 && (
          <div className={`text-center text-sm py-8 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
            与训练后的 {personaName} 人格开始对话，测试训练效果...
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-2 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${m.role === 'user' ? 'bg-[var(--accent-cyan)] text-white' : 'bg-[var(--accent-purple)] text-white'}`}>
                {m.role === 'user' ? '你' : personaCode.slice(0, 2).toUpperCase()}
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm border ${m.role === 'user' ? 'bg-[color:color-mix(in_srgb,currentColor_10%,transparent)] border-current/10' : 'bg-[color:color-mix(in_srgb,currentColor_6%,transparent)] border-current/10'}`}>
                <div className={`text-[10px] opacity-60 mb-1 ${m.role === 'user' ? 'text-[var(--accent-cyan)]' : 'text-[var(--accent-purple)]'}`}>
                  {m.role === 'user' ? '你' : '人格'}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <div className={`w-8 h-8 rounded-full bg-[var(--accent-purple)] text-white flex items-center justify-center`}>
              {personaCode.slice(0, 2).toUpperCase()}
            </div>
            <div className={`px-3 py-2 rounded-2xl border border-current/10 bg-[color:color-mix(in_srgb,currentColor_6%,transparent)]`}>
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full bg-current/40 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-current/40 animate-bounce [animation-delay:120ms]"></span>
                <span className="w-2 h-2 rounded-full bg-current/40 animate-bounce [animation-delay:240ms]"></span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <form onSubmit={send} className="flex items-center gap-2">
        <input
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${inputClass} focus:outline-none focus:ring-2 ${focusRing}`}
          placeholder={`向 ${personaName} 说点什么...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className={`px-4 h-10 rounded-lg text-white ${accentBtn} disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center`}
          disabled={loading || !input.trim()}
        >
          {loading ? '发送中...' : '发送'}
        </button>
      </form>

      <div className={`mt-3 text-xs ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-500'}`}>
        预览模式：此处的对话不会保存，仅用于测试训练效果
      </div>
    </div>
  );
}

