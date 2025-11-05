'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';

interface Letter {
  letterId: string;
  title: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
}

export default function LetterDetailPage({ params }: { params: Promise<{ letterId: string }> }) {
  const { letterId } = use(params);
  const { mode } = useVibe();
  const router = useRouter();
  const panelClass = mode === 'waibi' ? 'bg-black/90 border border-green-500/30 text-white' : 'bg-white border border-gray-200 text-gray-900';
  const secondaryBtn = mode === 'waibi' ? 'border border-green-500/30 bg-gray-800/50 hover:bg-gray-800' : 'border border-gray-300 bg-gray-50 hover:bg-gray-100';

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLetter();
  }, [letterId]);

  const fetchLetter = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/letters/${letterId}`);
      if (res.ok) {
        const data = await res.json();
        setLetter(data.letter);
      } else if (res.status === 404) {
        setError('信件不存在');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-2 max-w-4xl">
        <SectionHeader title="加载中..." subtitle="" />
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="container mx-auto px-4 py-2 max-w-4xl">
        <SectionHeader title="信件详情" subtitle="" />
        <div className={`text-center py-12 rounded-xl ${panelClass}`}>
          <div className={mode === 'waibi' ? 'text-red-400' : 'text-red-600'}>
            {error || '信件不存在'}
          </div>
          <button
            onClick={() => router.push('/')}
            className={`mt-4 px-4 py-2 rounded-lg ${secondaryBtn}`}
          >
            返回信件列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-4xl">
      <SectionHeader title="歪比宇宙信件" subtitle={letter.title} />

      <div className={`rounded-xl shadow-md p-6 sm:p-8 mt-6 ${panelClass}`}>
        <div className="mb-6">
          <h1 className={`text-3xl font-bold mb-4 ${mode === 'waibi' ? 'text-white' : 'text-gray-900'}`}>
            {letter.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm opacity-80 mb-4">
            <div className="flex items-center gap-2">
              <span>作者：</span>
              <span className="font-medium">{letter.author || '歪比宇宙'}</span>
            </div>
            {letter.category && (
              <div className="flex items-center gap-2">
                <span>•</span>
                <span>{letter.category}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>{formatDate(letter.publishedAt || letter.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>•</span>
              <span>👁 {letter.viewCount} 次查看</span>
            </div>
          </div>

          {letter.tags && letter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {letter.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-xs ${
                    mode === 'waibi'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={`prose prose-lg max-w-none ${mode === 'waibi' ? 'prose-invert' : ''}`}>
          <div
            className={`whitespace-pre-wrap leading-relaxed ${mode === 'waibi' ? 'text-gray-200' : 'text-gray-800'}`}
          >
            {letter.content}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => router.push('/')}
            className={`px-4 py-2 rounded-lg ${secondaryBtn}`}
          >
            ← 返回信件列表
          </button>
        </div>
      </div>
    </div>
  );
}

