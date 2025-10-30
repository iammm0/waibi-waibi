'use client'

import SectionHeader from '@/components/section-header';
import Link from 'next/link';
import { MBTI_TYPES } from '@/lib/mbti';
import { useVibe } from '@/app/providers';

export default function MbtiIndexPage() {
  const { mode } = useVibe();
  const cardClass = mode === 'waibi'
    ? 'bg-black border border-green-500/30 hover:border-green-400/50'
    : 'bg-white border border-gray-200 hover:border-gray-300';
  const nameClass = mode === 'waibi' ? 'text-white' : 'text-gray-900';
  const descClass = mode === 'waibi' ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <SectionHeader
        title="选择你要训练的人格"
        subtitle="点击一个人格进入其训练详情页，预置该人格的提示词与画像"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MBTI_TYPES.map((p) => (
          <Link
            key={p.id}
            href={`/mbti/${p.id}`}
            className={`rounded-xl overflow-hidden transition shadow-sm ${cardClass}`}
          >
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className={`text-lg font-semibold ${nameClass}`}>{p.name}</div>
              <div className={`text-sm mt-1 line-clamp-2 ${descClass}`}>{p.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
