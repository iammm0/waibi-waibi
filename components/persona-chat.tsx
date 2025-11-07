"use client";

import { useEffect, useRef, useState } from 'react';
import { useVibe } from '@/app/providers';
import { FaSpinner } from 'react-icons/fa6';
import { fetchWithAuth } from '@/lib/auth-utils';

interface PersonaChatProps {
  instanceId: string;
  model: string;
}

export default function PersonaChat({ instanceId, model }: PersonaChatProps) {
  const { mode } = useVibe();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // 发送消息加载
  const [personaLoading, setPersonaLoading] = useState(false); // 切换人格时加载
  const [messages, setMessages] = useState<Array<{ role: 'user'|'assistant'|'system'; content: string }>>([]);
  const [instanceInfo, setInstanceInfo] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  // 获取实例信息
  useEffect(() => {
    if (!instanceId) {
      setInstanceInfo(null);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;
    
    fetchWithAuth(`/api/persona-instance/${instanceId}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.instance) {
          setInstanceInfo(data.instance);
        }
      })
      .catch(() => setInstanceInfo(null));
  }, [instanceId]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token || !instanceId) { setMessages([]); return; }
    setPersonaLoading(true);
    // 使用模型实例的personaCode来获取历史记录
    fetchWithAuth(`/api/persona/instance_${instanceId}/history`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.items || data.items.length === 0) { 
          setMessages([]); 
          return; 
        }
        // 合并所有交互记录的消息，按时间顺序排列
        const allMessages: Array<{ role: 'user'|'assistant'|'system'; content: string; createdAt?: Date }> = [];
        
        // 遍历所有交互记录，提取所有消息
        data.items.forEach((interaction: any) => {
          if (Array.isArray(interaction.messages)) {
            interaction.messages.forEach((msg: any) => {
              // 过滤掉system消息，只保留user和assistant的消息
              if (msg.role !== 'system') {
                allMessages.push({
                  role: msg.role,
                  content: msg.content,
                  createdAt: msg.createdAt || interaction.createdAt || new Date(),
                });
              }
            });
          }
        });
        
        // 按创建时间排序（从早到晚，显示完整聊天历史）
        allMessages.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });
        
        setMessages(allMessages.map(m => ({ role: m.role, content: m.content })));
      })
      .catch(() => setMessages([]))
      .finally(() => setPersonaLoading(false));
  }, [instanceId]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || personaLoading) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      alert('请先登录后再进行此操作');
      return;
    }
    setLoading(true);
    const optimistic = [...messages, { role: 'user' as const, content: text }];
    setMessages(optimistic);
    setInput('');
    // 重置textarea高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    try {
      const res = await fetchWithAuth(`/api/persona-instance/${instanceId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model: model || undefined })
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
        setMessages([...optimistic, { role: 'assistant', content: data.response }]);
      }
    } catch (err: any) {
      setMessages([...optimistic, { role: 'assistant', content: `出错了：${err?.message || '未知错误'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const chatBgClass = mode === 'waibi' 
    ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950' 
    : 'bg-gradient-to-b from-gray-50 via-white to-gray-50';
  const inputClass = mode === 'waibi'
    ? 'bg-gray-800/80 border-gray-700/50 text-white placeholder-gray-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const accentBtn = mode === 'waibi'
    ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20'
    : 'bg-[var(--accent-cyan)] hover:brightness-110 shadow-md';

  return (
    <div className="flex flex-col h-full">
      {/* 消息区 */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto ${chatBgClass} p-4 space-y-6`}
      >
        {personaLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm opacity-80">
            <FaSpinner className="animate-spin text-[var(--accent-cyan)]" />
            <span>正在加载记忆…</span>
          </div>
        )}

        {!personaLoading && !instanceId && (
          <div className={`flex flex-col items-center justify-center h-full ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ${
              mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-600'
            }`}>
              💬
            </div>
            <div className="text-2xl font-semibold mb-2">选择模型实例</div>
            <div className="text-sm opacity-70">请从侧边栏选择一个模型实例开始对话</div>
          </div>
        )}

        {!personaLoading && instanceId && messages.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-full ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-600'}`}>
            {instanceInfo?.avatarUrl ? (
              <img
                src={instanceInfo.avatarUrl}
                alt={instanceInfo.name}
                className="w-16 h-16 rounded-full object-cover mb-4"
              />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ${
                mode === 'waibi' ? 'bg-green-500/20 text-green-400' : 'bg-blue-100 text-blue-600'
              }`}>
                {instanceInfo?.name?.slice(0, 2) || 'AI'}
              </div>
            )}
            <div className="text-2xl font-semibold mb-2">与 {instanceInfo?.name || '模型实例'} 开始对话</div>
            <div className="text-sm opacity-70">{instanceInfo?.description || '开始你的对话之旅'}</div>
          </div>
        )}

        {!personaLoading && messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex items-start gap-3 max-w-3xl ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 shadow-md ${
                m.role === 'user' 
                  ? mode === 'waibi'
                    ? 'bg-green-500 text-white'
                    : 'bg-[var(--accent-cyan)] text-white'
                  : mode === 'waibi'
                    ? 'bg-[var(--accent-purple)] text-white'
                    : 'bg-purple-500 text-white'
              }`}>
                {m.role === 'user' ? '你' : (instanceInfo?.name?.slice(0, 2) || 'AI')}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? mode === 'waibi'
                    ? 'bg-green-500/25 text-white border border-green-500/30'
                    : 'bg-blue-100 text-gray-900 border border-blue-200'
                  : mode === 'waibi'
                    ? 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
                    : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-9 h-9 rounded-full shadow-md flex items-center justify-center shrink-0 ${
              mode === 'waibi' 
                ? 'bg-[var(--accent-purple)] text-white' 
                : 'bg-purple-500 text-white'
            }`}>
              {instanceInfo?.name?.slice(0, 2) || 'AI'}
            </div>
            <div className={`px-4 py-3 rounded-2xl shadow-sm ${
              mode === 'waibi' 
                ? 'bg-gray-800/80 border border-gray-700/50' 
                : 'bg-white border border-gray-200'
            }`}>
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
      <div className={`border-t backdrop-blur-sm ${mode === 'waibi' ? 'border-green-500/20 bg-black/80' : 'border-gray-200 bg-white/95'} p-4`}>
        <form onSubmit={send} className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className={`w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 overflow-y-auto transition-all ${
                mode === 'waibi'
                  ? 'focus:ring-green-500/50 ' + inputClass
                  : 'focus:ring-[var(--accent-cyan)] ' + inputClass
              }`}
              placeholder={`向 ${instanceInfo?.name || '模型实例'} 说点什么...`}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // 自动调整高度
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(e);
                }
              }}
              rows={1}
              disabled={loading || personaLoading}
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />
          </div>
          <button
            type="submit"
            className={`px-6 h-12 rounded-xl text-white ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 font-medium hover:scale-105 active:scale-95`}
            disabled={loading || personaLoading || !input.trim()}
          >
            {loading ? <FaSpinner className="animate-spin" /> : '发送'}
          </button>
        </form>
        <div className={`text-xs text-center mt-2 ${mode === 'waibi' ? 'text-gray-500' : 'text-gray-400'}`}>
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
}