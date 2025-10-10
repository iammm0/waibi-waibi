import type { ReactNode } from "react";

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
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl sm:text-4xl">
          <span className="pixel-text">{title}</span>
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-base opacity-80">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
