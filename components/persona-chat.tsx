"use client";

import { useEffect, useRef, useState } from 'react';
import { MBTI_TYPES } from '@/lib/mbti';
import { useVibe } from '@/app/providers';
import { FaSpinner } from 'react-icons/fa6';

// 轻量级、适合聊天的模型（OpenAI 兼容或代理到 openai 风格端点）
const DEFAULT_MODELS = [
  'gpt-4o-mini',            // OpenAI 轻量聊天
  'gpt-4.1-nano',          // Nano 级成本
  'gpt-4.1-mini',          // Mini 级性能/成本折中
  'deepseek-v3.1',         // DeepSeek 轻量聊天
  'deepseek-chat',         // DeepSeek 聊天稳定版
  'qwen-turbo',            // 阿里通义 Turbo 级
  'mistral-small-latest',  // Mistral 小型聊天
  'llama-3-8b',            // Meta 小参数聊天
  'yi-lightning',          // 零一万物轻量
  'glm-4.5-flash',         // 智谱轻量快推
];

export default function PersonaChat() {
  const { mode } = useVibe();
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
      {/* 顶部工具栏 */}
      <div className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold tracking-wide">聊天</div>
            {personaLoading && (
              <div className="flex items-center gap-2 text-sm opacity-80">
                <FaSpinner className="animate-spin text-[var(--accent-cyan)]" />
                <span>人格意识在思考中…</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 text-sm w-full">
            <label className={`${mode === 'waibi' ? 'text-white opacity-70' : 'text-gray-900 opacity-100'}`}>人格</label>
            <select
              className={`w-full sm:w-auto rounded-md border px-2 py-2 sm:py-1 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] ${mode === 'waibi' ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
              value={code}
              onChange={(e)=>setCode(e.target.value)}
            >
              {MBTI_TYPES.map((p) => (
                <option className={mode === 'waibi' ? 'bg-black text-white' : 'bg-white text-gray-900'} key={p.id} value={p.name.toLowerCase()}>{p.name}</option>
              ))}
            </select>
            <label className={`ml-2 ${mode === 'waibi' ? 'text-white opacity-70' : 'text-gray-900 opacity-100'}`}>模型</label>
            <select
              className={`w-full sm:w-auto rounded-md border px-2 py-2 sm:py-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] ${mode === 'waibi' ? 'bg-black text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`}
              value={model}
              onChange={(e)=>setModel(e.target.value)}
            >
              {DEFAULT_MODELS.map((m) => (
                <option className={mode === 'waibi' ? 'bg-black text-white' : 'bg-white text-gray-900'} key={m} value={m}>{m}</option>
              ))}
              <option className={mode === 'waibi' ? 'bg-black text-white' : 'bg-white text-gray-900'} value="">自定义...</option>
            </select>
            <input
              className={`w-full sm:w-auto min-w-[200px] rounded-md border px-3 py-2 sm:py-1 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] ${mode === 'waibi' ? 'bg-black text-white border-gray-700 placeholder-gray-400' : 'bg-white text-gray-900 border-gray-300'}`}
              placeholder="自定义模型名（留空则用上面选择）"
              value={customModel}
              onChange={(e)=>setCustomModel(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 消息区 */}
      <div className="rounded-2xl border p-3 sm:p-4 max-h-[520px] overflow-y-auto space-y-3 bg-[color:color-mix(in_srgb,transparent_92%,currentColor_5%)]">
        {personaLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm opacity-80">
            <FaSpinner className="animate-spin text-[var(--accent-cyan)]" />
            <span>正在加载 {code.toUpperCase()} 的记忆…</span>
          </div>
        )}

        {!personaLoading && messages.length === 0 && (
          <div className="text-center text-sm opacity-70 py-10">
            还没有消息，先和 {code.toUpperCase()} 打个招呼吧～
          </div>
        )}

        {!personaLoading && messages.map((m, i) => (
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`flex items-start gap-2 max-w-[80%] ${m.role==='user'?'flex-row-reverse':''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${m.role==='user'?'bg-[var(--accent-cyan)] text-white':'bg-[var(--accent-purple)] text-white'}`}>
                {m.role==='user'?'你':code.slice(0,2).toUpperCase()}
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm border ${m.role==='user'?'bg-[color:color-mix(in_srgb,currentColor_10%,transparent)] border-current/10':'bg-[color:color-mix(in_srgb,currentColor_6%,transparent)] border-current/10'}`}>
                <div className={`text-[10px] opacity-60 mb-1 ${m.role==='user'?'text-[var(--accent-cyan)]':'text-[var(--accent-purple)]'}`}>{m.role==='user'?'你':'人格'}</div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm opacity-80">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-purple)] text-white flex items-center justify-center">{code.slice(0,2).toUpperCase()}</div>
            <div className="px-3 py-2 rounded-2xl border border-current/10 bg-[color:color-mix(in_srgb,currentColor_6%,transparent)]">
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
      <form onSubmit={send} className="sticky bottom-2 flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border border-current/30 bg-transparent px-3 py-2 text-sm shadow-sm"
          placeholder={`向 ${code.toUpperCase()} 说点什么...`}
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          disabled={loading || personaLoading}
        />
        <button type="submit" className="px-4 h-10 rounded-lg text-white bg-[var(--accent-cyan)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition" disabled={loading || personaLoading || !input.trim()}>
          {loading ? <FaSpinner className="animate-spin" /> : '发送'}
        </button>
      </form>
    </div>
  );
}