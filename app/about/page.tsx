"use client";

import { useVibe } from '@/app/providers';
import SectionHeader from '@/components/section-header';
import { MBTI_TYPES } from '@/lib/mbti';
import Link from 'next/link';

export default function AboutPage() {
  const { mode } = useVibe();
  const panelClass = mode === 'waibi' 
    ? 'bg-black/90 border border-green-500/30 text-white' 
    : 'bg-white border border-gray-200 text-gray-900';
  const accentClass = mode === 'waibi' 
    ? 'text-green-400' 
    : 'text-[var(--accent-cyan)]';

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <SectionHeader 
        title="关于 waibi 宇宙" 
        subtitle="探索16种人格的无限可能" 
      />

      <div className="space-y-8 mt-8">
        {/* 核心介绍 */}
        <section className={`rounded-xl p-6 ${panelClass}`}>
          <h2 className={`text-2xl font-bold mb-4 ${accentClass} pixel-text`}>
            欢迎来到 waibi 宇宙
          </h2>
          <div className="space-y-4 text-base leading-relaxed opacity-90">
            <p>
              waibi 宇宙是一个基于 MBTI（迈尔斯-布里格斯类型指标）的交互式平台。
              在这里，你可以探索 16 种不同的人格类型，与它们对话，训练它们，
              并在留言板中分享你的想法。
            </p>
            <p>
              我们相信每个人格类型都有其独特的价值。无论是理性分析的 INTJ，
              还是热情奔放的 ENFP，每一种视角都值得被尊重和理解。
            </p>
          </div>
        </section>

        {/* 功能特色 */}
        <section className={`rounded-xl p-6 ${panelClass}`}>
          <h2 className={`text-2xl font-bold mb-4 ${accentClass} pixel-text`}>
            核心功能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-current/5 border border-current/10">
              <h3 className="font-semibold mb-2">💬 人格对话</h3>
              <p className="text-sm opacity-80">
                与 16 种不同的人格类型进行对话，体验不同思维方式的碰撞。
              </p>
            </div>
            <div className="p-4 rounded-lg bg-current/5 border border-current/10">
              <h3 className="font-semibold mb-2">🎯 人格训练</h3>
              <p className="text-sm opacity-80">
                通过训练样本，定制你理想中的人格对话风格。
              </p>
            </div>
            <div className="p-4 rounded-lg bg-current/5 border border-current/10">
              <h3 className="font-semibold mb-2">📝 留言板</h3>
              <p className="text-sm opacity-80">
                以你的人格视角，在留言板中分享你的想法和感悟。
              </p>
            </div>
            <div className="p-4 rounded-lg bg-current/5 border border-current/10">
              <h3 className="font-semibold mb-2">🎨 个性化</h3>
              <p className="text-sm opacity-80">
                支持匿名或实名留言，保护你的隐私，或展示真实的自己。
              </p>
            </div>
          </div>
        </section>

        {/* 16种人格概览 */}
        <section className={`rounded-xl p-6 ${panelClass}`}>
          <h2 className={`text-2xl font-bold mb-4 ${accentClass} pixel-text`}>
            16 种人格类型
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {MBTI_TYPES.map((persona) => (
              <Link
                key={persona.id}
                href={`/mbti/${persona.id}`}
                className={`p-3 rounded-lg text-center transition hover:scale-105 ${
                  mode === 'waibi' 
                    ? 'bg-gray-900/50 border border-green-500/30 hover:border-green-500/60' 
                    : 'bg-gray-50 border border-gray-200 hover:border-[var(--accent-cyan)]'
                }`}
              >
                <div className="text-lg font-bold mb-1">{persona.name}</div>
                <div className="text-xs opacity-70 line-clamp-2">{persona.description}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* 设计理念 */}
        <section className={`rounded-xl p-6 ${panelClass}`}>
          <h2 className={`text-2xl font-bold mb-4 ${accentClass} pixel-text`}>
            设计理念
          </h2>
          <div className="space-y-3 text-base leading-relaxed opacity-90">
            <p>
              waibi 宇宙的设计理念是<strong className={accentClass}>"真实地表达自己"</strong>。
              我们相信，每个人格类型都有其独特的优势，没有好坏之分。
            </p>
            <p>
              通过 MBTI 框架，我们提供了一个安全、包容的空间，
              让用户可以探索不同的人格视角，理解彼此的差异，并在交流中成长。
            </p>
            <p className="pt-2 italic opacity-80">
              "人格不是标签，而是我们理解世界的方式。"
            </p>
          </div>
        </section>

        {/* 快速开始 */}
        <section className={`rounded-xl p-6 ${panelClass}`}>
          <h2 className={`text-2xl font-bold mb-4 ${accentClass} pixel-text`}>
            快速开始
          </h2>
          <div className="space-y-3">
            <Link 
              href="/guestbook"
              className={`block p-4 rounded-lg transition hover:scale-[1.02] ${
                mode === 'waibi' 
                  ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30' 
                  : 'bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/20'
              }`}
            >
              <div className="font-semibold mb-1">📝 查看留言板</div>
              <div className="text-sm opacity-80">看看其他用户的留言和想法</div>
            </Link>
            <Link 
              href="/chat"
              className={`block p-4 rounded-lg transition hover:scale-[1.02] ${
                mode === 'waibi' 
                  ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30' 
                  : 'bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/20'
              }`}
            >
              <div className="font-semibold mb-1">💬 开始对话</div>
              <div className="text-sm opacity-80">与不同人格类型的AI进行对话</div>
            </Link>
            <Link 
              href="/mbti"
              className={`block p-4 rounded-lg transition hover:scale-[1.02] ${
                mode === 'waibi' 
                  ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30' 
                  : 'bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/20'
              }`}
            >
              <div className="font-semibold mb-1">🎯 训练人格</div>
              <div className="text-sm opacity-80">定制你理想的人格对话风格</div>
            </Link>
          </div>
        </section>

        {/* 关于开发者 */}
        <section className={`rounded-xl p-6 ${panelClass}`}>
          <h2 className={`text-2xl font-bold mb-4 ${accentClass} pixel-text`}>
            waibi 宇宙的开发者
          </h2>
          <div className="space-y-3 text-base leading-relaxed opacity-90">
            <p>
              waibi 宇宙由一位 <strong className={accentClass}>INTJ</strong> 类型的开发者创建。
              他希望这个平台能够成为大家交流、探索和成长的桥梁。
            </p>
            <p>
              如果你有任何建议或想法，欢迎在留言板中分享。
              每一个声音都很重要，每一个想法都值得被倾听。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

