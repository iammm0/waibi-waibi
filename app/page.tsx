'use client'

import SectionHeader from '@/components/section-header';
import Link from 'next/link';
import { MBTI_TYPES } from '@/lib/mbti';
import { useVibe } from '@/app/providers';
import ProgressiveImage from '@/components/progressive-image';
import { getPersonaCardClasses, getPersonaButtonClasses } from '@/lib/persona-colors';

export default function HomePage() {
  const { mode } = useVibe();
  const nameClass = mode === 'waibi' ? 'text-white' : 'text-gray-900';
  const descClass = mode === 'waibi' ? 'text-gray-300' : 'text-gray-600';
  
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
        title="选择你要训练的人格"
        subtitle="点击一个人格进入其训练页面，预置该人格的提示词与画像"
        actions={
          <a
            href="https://www.16personalities.com/ch"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded-lg text-white transition ${
              mode === 'waibi'
                ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-900'
            } flex items-center gap-2`}
          >
            <span>不知道自己的MBTI?</span>
          </a>
        }
      />

      {ordered.map((g) => {
        const items = MBTI_TYPES.filter(p => groups[g].includes(p.name));
        return (
          <div key={g} className="mt-8">
            <h3 className={`text-xl font-semibold mb-4 ${nameClass}`}>{g} 分组</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((p, index) => {
                const cardClass = getPersonaCardClasses(p.name, mode);
                const accentBtn = getPersonaButtonClasses(p.name, mode);
                const colors = require('@/lib/persona-colors').getPersonaColors(p.name, mode);
                // 第一个图片（通常是 INTJ）设置为 priority 以优化 LCP
                const isFirstImage = g === 'NT' && index === 0;
                
                return (
                  <div
                    key={p.id}
                    className={`group rounded-xl overflow-hidden transition-all duration-300 shadow-sm ${cardClass} hover:shadow-xl hover:-translate-y-2`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden relative">
                      <ProgressiveImage
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        objectFit="cover"
                        priority={isFirstImage}
                        className="transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* 悬浮时显示的操作按钮 - 分为上下两半 */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col">
                        {/* 上半部分：查看详情 */}
                        <Link
                          href={`/mbti/${p.id}/about`}
                          className={`flex-1 flex items-center justify-center ${accentBtn} hover:opacity-90 transition-all`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-sm font-semibold">查看详情</span>
                        </Link>
                        {/* 分隔线 */}
                        <div className={`h-px ${
                          colors.border.includes('purple') ? 'bg-purple-400/50' :
                          colors.border.includes('emerald') ? 'bg-emerald-400/50' :
                          colors.border.includes('blue') ? 'bg-blue-400/50' :
                          'bg-amber-400/50'
                        }`}></div>
                        {/* 下半部分：开始训练 */}
                        <Link
                          href={`/mbti/${p.id}`}
                          className={`flex-1 flex items-center justify-center transition-all ${
                            mode === 'waibi'
                              ? `bg-gray-800/80 hover:bg-gray-700/80 text-white`
                              : 'bg-white/80 hover:bg-gray-50/80 text-gray-900'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-sm font-semibold">开始训练</span>
                        </Link>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className={`text-lg font-semibold ${nameClass}`}>{p.name}</div>
                      <div className={`text-sm mt-1 line-clamp-2 ${descClass}`}>
                        {p.description.length > 50 ? p.description.slice(0, 50) + '...' : p.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
