import Link from "next/link";
import type { MindDumpEntry } from "@/data/mind-dump";

interface MindDumpPreview extends MindDumpEntry {
  formattedDate: string;
  waibiIndex: number;
}

export default function MindDumpCard({ entry }: { entry: MindDumpPreview }) {
  return (
    <article className="card-base crt-filter flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">
            <Link href={`/mind-dump/${entry.slug}`} className="glitch-hover">
              {entry.title}
            </Link>
          </h2>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] opacity-60 pixel-text">
            {entry.formattedDate}
          </p>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="pixel-text text-[0.65rem] uppercase tracking-[0.2em]">
            歪比指数
          </span>
          <span className="text-2xl font-bold text-[var(--accent-green)]">
            {entry.waibiIndex}
          </span>
        </div>
      </header>
      <p className="text-sm opacity-80">{entry.summary}</p>
      <footer className="mt-auto flex flex-wrap items-center gap-2 text-[0.7rem]">
        {entry.tags.map((tag) => (
          <span key={tag} className="badge opacity-70">
            #{tag}
          </span>
        ))}
        <Link
          href={`/mind-dump/${entry.slug}`}
          className="ml-auto badge glitch-hover"
        >
          查看理性解释
        </Link>
      </footer>
    </article>
  );
}
