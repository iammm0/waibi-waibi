"use client";

import { useState, useEffect } from 'react';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import { MBTI_TYPES } from '@/lib/mbti';

interface Message {
  id: string;
  content: string;
  personaCode: string;
  username: string;
  isAnonymous: boolean;
  isSystem: boolean;
  createdAt: string;
}

export default function GuestbookPage() {
  const { mode } = useVibe();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    personaCode: 'intj',
    content: '',
    isAnonymous: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const inputClass = mode === 'waibi' ? 'border border-green-500/30 bg-black text-white' : 'border border-gray-300 bg-white text-gray-900';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  const cardClass = mode === 'waibi' ? 'bg-black/50 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guestbook?limit=100');
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('获取留言失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) {
      setError('请输入留言内容');
      return;
    }
    if (form.content.trim().length > 500) {
      setError('留言内容不能超过500字');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token && !form.isAnonymous) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          personaCode: form.personaCode,
          content: form.content.trim(),
          isAnonymous: form.isAnonymous,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setForm({ personaCode: form.personaCode, content: '', isAnonymous: form.isAnonymous });
        setTimeout(() => {
          setSuccess(false);
          fetchMessages(); // 刷新留言列表
        }, 2000);
      } else {
        setError(data?.message || '提交失败');
      }
    } catch (error: any) {
      setError(error?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getPersonaName = (code: string) => {
    const persona = MBTI_TYPES.find(p => p.name.toLowerCase() === code.toLowerCase());
    return persona?.name || code.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <SectionHeader 
        title="留言板" 
        subtitle="选择你的人格，留下一句想说的话。匿名或实名都可以。" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* 提交留言表单 */}
        <div className={`rounded-xl shadow-md p-6 ${panelClass}`}>
          <h2 className="text-xl font-semibold mb-4">留下你的留言</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">选择人格</label>
              <select
                className={`w-full p-3 rounded-lg ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500' : 'focus:ring-[var(--accent-cyan)]'}`}
                value={form.personaCode}
                onChange={(e) => setForm({ ...form, personaCode: e.target.value })}
              >
                {MBTI_TYPES.map((p) => (
                  <option key={p.id} value={p.name.toLowerCase()}>
                    {p.name} - {p.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">留言内容</label>
              <textarea
                className={`w-full p-3 rounded-lg min-h-[120px] ${inputClass} focus:outline-none focus:ring-2 ${mode === 'waibi' ? 'focus:ring-green-500' : 'focus:ring-[var(--accent-cyan)]'}`}
                placeholder="想说点什么..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                maxLength={500}
              />
              <div className="text-xs opacity-70 mt-1">
                {form.content.length}/500
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="anonymous" className="text-sm">匿名留言</label>
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}
            {success && <div className="text-sm text-green-500">留言提交成功！</div>}

            <button
              type="submit"
              disabled={submitting || !form.content.trim()}
              className={`w-full py-3 rounded-lg text-white transition ${accentBtn} ${submitting || !form.content.trim() ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {submitting ? '提交中...' : '提交留言'}
            </button>
          </form>
        </div>

        {/* 留言列表 */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">留言墙</h2>
          {loading ? (
            <div className={`text-center py-12 ${cardClass} rounded-xl`}>
              <div className="text-sm opacity-70">加载中...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className={`text-center py-12 ${cardClass} rounded-xl`}>
              <div className="text-sm opacity-70">还没有留言，快来留下第一条吧！</div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const persona = MBTI_TYPES.find(p => p.name.toLowerCase() === msg.personaCode.toLowerCase());
                return (
                  <div key={msg.id} className={`rounded-xl p-4 shadow-md ${cardClass}`}>
                    <div className="flex items-start gap-4">
                      {persona && (
                        <img 
                          src={persona.image} 
                          alt={persona.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-current/20"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-semibold ${msg.isSystem ? 'text-yellow-400' : ''}`}>
                            {msg.isSystem ? 'waibi宇宙的开发者' : msg.username}
                          </span>
                          <span className="text-xs opacity-70 px-2 py-1 rounded bg-current/10">
                            {getPersonaName(msg.personaCode)}
                          </span>
                          {msg.isAnonymous && (
                            <span className="text-xs opacity-50">匿名</span>
                          )}
                          {msg.isSystem && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                              系统
                            </span>
                          )}
                        </div>
                        <div className="mb-2 whitespace-pre-wrap break-words">{msg.content}</div>
                        <div className="text-xs opacity-60">{formatDate(msg.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

