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
  const containerClass = mode === 'waibi'
    ? 'bg-black border border-green-500/30'
    : 'bg-white border border-gray-200';
  const titleClass = mode === 'waibi' ? 'text-white' : 'text-gray-900';
  const subTitleClass = mode === 'waibi' ? 'text-gray-300' : 'text-gray-600';

  return (
    <header className={`mb-8 rounded-xl p-6 ${containerClass}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={`text-3xl sm:text-4xl ${titleClass}`}>
            <span className="pixel-text">{title}</span>
          </h1>
          {subtitle ? (
            <p className={`mt-2 max-w-2xl text-base opacity-80 ${subTitleClass}`}>{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}