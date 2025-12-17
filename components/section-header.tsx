'use client';

import type { ReactNode } from "react";
import { useVibe } from '@/app/providers';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  actions,
}: SectionHeaderProps) {
  const { mode } = useVibe();
  
  // 紧凑的设计，减少垂直空间
  const containerClass = mode === 'waibi'
    ? 'border-b border-gray-700'
    : 'border-b border-gray-200';
  
  const titleClass = mode === 'waibi' 
    ? 'text-white' 
    : 'text-gray-900';
  
  const subTitleClass = mode === 'waibi' 
    ? 'text-gray-400' 
    : 'text-gray-500';

  return (
    <header className={`mb-4 pb-3 ${containerClass}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h1 className={`text-xl sm:text-2xl font-bold ${titleClass} flex items-center gap-2`}>
              <span className="pixel-text truncate">{title}</span>
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
