'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import UniverseStatus from '@/components/universe-status';

interface Letter {
  letterId: string;
  title: string;
  author?: string;
  category?: string;
  tags?: string[];
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  isRead?: boolean; // 是否已读
}

export default function InboxPage() {
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const cardClass = mode === 'waibi' ? 'bg-gray-900/50 border border-green-500/30 hover:border-green-500/50' : 'bg-gray-50 border border-gray-200 hover:border-gray-300';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLetters();
  }, []);

  // 当从信件详情页返回时，刷新列表以更新未读状态
  useEffect(() => {
    const handleFocus = () => {
      fetchLetters();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchLetters = async () => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/letters?limit=50', { headers });
      if (res.ok) {
        const data = await res.json();
        setLetters(data.letters || []);
      } else {
        setError('加载信件失败');
      }
    } catch (err) {
      setError('加载信件失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader 
        title="收件箱" 
        subtitle="来自歪比宇宙的信件，记录着我们的故事与思考" 
      />

      {loading ? (
        <UniverseStatus type="loading" context="letter" />
      ) : error ? (
        <UniverseStatus
          type="error"
          context="letter"
          message={error}
          actionHref="/"
          actionLabel="返回首页"
        />
      ) : letters.length === 0 ? (
        <div className={`text-center py-12 rounded-xl ${panelClass}`}>
          <div className="text-6xl mb-4">📭</div>
          <div className={`text-lg ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-700'}`}>
            暂无信件
          </div>
          <p className={`text-sm mt-2 opacity-70 ${mode === 'waibi' ? 'text-gray-400' : 'text-gray-600'}`}>
            来自歪比宇宙的信件正在路上...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {letters.map((letter) => (
            <div
              key={letter.letterId}
              className={`rounded-xl shadow-md p-5 cursor-pointer transition-all relative ${cardClass}`}
              onClick={() => router.push(`/letters/${letter.letterId}`)}
            >
              {/* 未读标识小红点 */}
              {letter.isRead === false && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
              
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-lg font-semibold flex-1 pr-4 ${mode === 'waibi' ? 'text-white' : 'text-gray-900'}`}>
                  {letter.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-3 text-xs opacity-70 mb-3">
                <span>{letter.author || '歪比宇宙'}</span>
                {letter.category && (
                  <>
                    <span>•</span>
                    <span>{letter.category}</span>
                  </>
                )}
              </div>

              {letter.tags && letter.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {letter.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded text-xs ${
                        mode === 'waibi'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs opacity-60">
                <span>{formatDate(letter.publishedAt || letter.createdAt)}</span>
                <span>👁 {letter.viewCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

