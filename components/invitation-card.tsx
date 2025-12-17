"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useVibe } from '@/app/providers';

export default function InvitationCard() {
  const { mode } = useVibe();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cardClass = mode === 'waibi' 
    ? 'bg-black/90 border-2 border-gray-600 text-white shadow-lg' 
    : 'bg-white/95 border-2 border-gray-400 text-gray-900 shadow-lg';

  const glowClass = mode === 'waibi'
    ? 'shadow-lg'
    : 'shadow-lg';

  if (!mounted) return null;

  return (
    <Link 
      href="/"
      className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 transition-all duration-300 ${
        isHovered ? 'scale-105 ' + glowClass : 'hover:scale-105'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${cardClass} rounded-2xl p-4 sm:p-6 max-w-xs cursor-pointer backdrop-blur-sm relative overflow-hidden`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`text-3xl sm:text-4xl ${mode === 'waibi' ? 'text-gray-300' : 'text-gray-700'}`}>
            ✉️
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base sm:text-lg mb-2 pixel-text">
              歪比宇宙信件
            </h3>
            <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
              查看来自歪比宇宙的信件和更新...
            </p>
            <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs opacity-60">
              <span>查看信件 →</span>
            </div>
          </div>
        </div>
        
        {/* 装饰性边框动画 */}
        <div className={`absolute inset-0 rounded-2xl border-2 ${
          mode === 'waibi' ? 'border-gray-600' : 'border-gray-400'
        } opacity-0 ${isHovered ? 'opacity-100' : ''} transition-opacity duration-300 pointer-events-none`} />
        
        {/* 背景光效 */}
        <div className={`absolute -inset-4 blur-xl opacity-20 ${
          mode === 'waibi' ? 'bg-gray-600' : 'bg-gray-400'
        } ${isHovered ? 'opacity-30' : ''} transition-opacity duration-300 pointer-events-none`} />
      </div>
    </Link>
  );
}

