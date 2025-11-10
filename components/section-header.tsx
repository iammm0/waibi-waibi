'use client';

import type { ReactNode } from "react";
import { useVibe } from '@/app/providers';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: string; // 可选的图标 emoji
}

export default function SectionHeader({
  title,
  subtitle,
  actions,
  icon,
}: SectionHeaderProps) {
  const { mode } = useVibe();
  
  // 紧凑的设计，减少垂直空间
  const containerClass = mode === 'waibi'
    ? 'border-b border-green-500/30'
    : 'border-b border-gray-200';
  
  const titleClass = mode === 'waibi' 
    ? 'text-white' 
    : 'text-gray-900';
  
  const subTitleClass = mode === 'waibi' 
    ? 'text-gray-400' 
    : 'text-gray-500';
  
  const accentClass = mode === 'waibi'
    ? 'text-green-400'
    : 'text-[var(--accent-cyan)]';

  return (
    <header className={`mb-4 pb-3 ${containerClass}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <span className={`text-2xl flex-shrink-0 ${accentClass}`}>
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className={`text-xl sm:text-2xl font-bold ${titleClass} flex items-center gap-2`}>
              <span className="pixel-text truncate">{title}</span>
              {mode === 'waibi' && (
                <span className="text-xs font-normal opacity-50 animate-pulse">✨</span>
              )}
            </h1>
            {subtitle && (
              <p className={`mt-1 text-xs sm:text-sm opacity-70 line-clamp-1 ${subTitleClass}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
