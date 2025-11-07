'use client'

import SectionHeader from '@/components/section-header';
import Link from 'next/link';
import { MBTI_TYPES } from '@/lib/mbti';
import { useVibe } from '@/app/providers';
import ProgressiveImage from '@/components/progressive-image';
import { FaExternalLinkAlt } from 'react-icons/fa';

export default function MbtiIndexPage() {
  const { mode } = useVibe();
  const cardClass = mode === 'waibi'
    ? 'bg-black border border-green-500/30 hover:border-green-400/50'
    : 'bg-white border border-gray-200 hover:border-gray-300';
  const nameClass = mode === 'waibi' ? 'text-white' : 'text-gray-900';
  const descClass = mode === 'waibi' ? 'text-gray-300' : 'text-gray-600';
  const accentBtn = mode === 'waibi' ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--accent-cyan)] hover:brightness-110';
  
  const groups: { [k: string]: string[] } = {
    NT: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
    NF: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
    SJ: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
    SP: ['ISTP', 'ISFP', 'ESTP', 'ESFP']
  };
  const ordered = ['NT', 'NF', 'SJ', 'SP'];

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">
      <SectionHeader
        icon="🧠"
        title="选择你要训练的人格"
        subtitle="点击一个人格进入其训练详情页，预置该人格的提示词与画像"
        actions={
          <a
            href="https://www.16personalities.com/ch"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-lg text-white transition ${accentBtn} flex items-center gap-2`}
          >
            <span>不知道自己的MBTI? 点击跳转到-16人格官方测试</span>
            <FaExternalLinkAlt className="text-sm" />
          </a>
        }
      />

      {ordered.map((g) => {
        const items = MBTI_TYPES.filter(p => groups[g].includes(p.name));
        return (
          <div key={g} className="mt-8">
            <h3 className={`text-xl font-semibold mb-4 ${nameClass}`}>{g} 分组</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/mbti/${p.id}`}
                  className={`rounded-xl overflow-hidden transition shadow-sm ${cardClass}`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden relative">
                    <ProgressiveImage
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      objectFit="cover"
                      priority={false}
                    />
                  </div>
                  <div className="p-4">
                    <div className={`text-lg font-semibold ${nameClass}`}>{p.name}</div>
                    <div className={`text-sm mt-1 line-clamp-2 ${descClass}`}>
                      {p.description.length > 50 ? p.description.slice(0, 50) + '...' : p.description}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
