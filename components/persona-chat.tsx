"use client";

import { useEffect, useRef, useState } from 'react';
import { MBTI_TYPES } from '@/lib/mbti';
import { FaSpinner } from 'react-icons/fa6';

const DEFAULT_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4o-realtime-preview-2024-12-17',
];

export default function PersonaChat() {
  const [code, setCode] = useState<string>('intj');
  const [model, setModel] = useState<string>('gpt-4o');
  const [customModel, setCustomModel] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // 发送消息加载
  const [personaLoading, setPersonaLoading] = useState(false); // 切换人格时加载
  const [messages, setMessages] = useState<Array<{ role: 'user'|'assistant'|'system'; content: string }>>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token || !code) { setMessages([]); return; }
    setPersonaLoading(true);
    fetch(`/api/persona/${code}/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.items) { setMessages([]); return; }
        const last = data.items[0];
        setMessages(Array.isArray(last?.messages) ? last.messages : []);
      })
      .catch(() => setMessages([]))
      .finally(() => setPersonaLoading(false));
  }, [code]);

  const effectiveModel = (customModel || model).trim();

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || personaLoading) return;
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const optimistic = [...messages, { role: 'user' as const, content: text }];
    setMessages(optimistic);
    setInput('');
    try {
      const res = await fetch(`/api/persona/${code}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: text, model: effectiveModel || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || '发送失败');
      setMessages([...optimistic, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages([...optimistic, { role: 'assistant', content: `出错了：${err?.message || '未知错误'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 顶部：人格下拉 + 加载状态（响应式布局） */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm opacity-70">人格：</label>
          <select
            className="rounded border px-2 py-1 min-w-[120px]"
            value={code}
            onChange={(e)=>setCode(e.target.value)}
          >
            {MBTI_TYPES.map((p) => (
              <option key={p.id} value={p.name.toLowerCase()}>{p.name}</option>
            ))}
          </select>
        </div>

        {personaLoading && (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <FaSpinner className="animate-spin text-[var(--accent-cyan)]" />
            <span>人格意识在思考中…</span>
          </div>
        )}
      </div>

      {/* 模型选择（响应式横排） */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
        <div className="flex items-center gap-2">
          <label className="opacity-70">模型：</label>
          <select
            className="rounded border px-2 py-1"
            value={model}
            onChange={(e)=>setModel(e.target.value)}
          >
            {DEFAULT_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="">自定义...</option>
          </select>
        </div>
        <input
          className="min-w-[220px] rounded border px-2 py-1"
          placeholder="自定义模型名（留空则用上面选择）"
          value={customModel}
          onChange={(e)=>setCustomModel(e.target.value)}
        />
      </div>

      {/* 消息区：在加载人格时显示骨架/动画提示 */}
      <div className="rounded-xl border p-3 max-h-[420px] overflow-y-auto space-y-2">
        {personaLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm opacity-80">
            <FaSpinner className="animate-spin text-[var(--accent-cyan)]" />
            <span>正在加载 {code.toUpperCase()} 的记忆…</span>
          </div>
        )}
        {!personaLoading && messages.map((m, i) => (
          <div key={i} className={`px-3 py-2 rounded ${m.role==='user'?'bg-[color:color-mix(in_srgb,currentColor_10%,transparent)]':'bg-[color:color-mix(in_srgb,currentColor_6%,transparent)]'}`}>
            <div className={`text-xs opacity-70 mb-1 ${m.role==='user'?'text-[var(--accent-cyan)]':'text-[var(--accent-purple)]'}`}>{m.role==='user'?'你':'人格'}</div>
            <div className="whitespace-pre-wrap text-sm">{m.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <form onSubmit={send} className="flex items-center gap-2">
        <input
          className="flex-1 rounded-md border border-current/30 bg-transparent px-2 py-2 text-sm"
          placeholder={`向 ${code.toUpperCase()} 说点什么...`}
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          disabled={loading || personaLoading}
        />
        <button type="submit" className="badge glitch-hover" disabled={loading || personaLoading || !input.trim()}>
          {loading ? <FaSpinner className="animate-spin" /> : '发送'}
        </button>
      </form>
    </div>
  );
}
