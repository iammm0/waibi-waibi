import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import SectionHeader from "@/components/section-header";
import { getMindDumpBySlug } from "@/data/mind-dump";
import { computeWaibiIndex, formatDate } from "@/lib/waibi";

interface MindDumpPageProps {
  params: { slug: string };
}

export default function MindDumpDetailPage({ params }: MindDumpPageProps) {
  const { slug } = params;
  const entry = getMindDumpBySlug(slug);
  if (!entry) {
    notFound();
  }
  const formattedDate = formatDate(entry.date);
  const waibiIndex = computeWaibiIndex(
    entry.seed,
    entry.summary + entry.content.length,
  );

  return (
    <article className="space-y-10">
      <SectionHeader
        title={entry.title}
        subtitle={`发表于 ${formattedDate} · 歪比指数 ${waibiIndex}`}
        actions={
          <div className="flex items-center gap-2 text-xs">
            {entry.tags.map((tag) => (
              <span key={tag} className="badge">
                #{tag}
              </span>
            ))}
          </div>
        }
      />
      <div className="space-y-6 text-base leading-relaxed">
        {entry.content.map((block) => {
          const serialized = Array.isArray(block.value)
            ? block.value.join("-")
            : block.value.slice(0, 32);
          const key = `${entry.slug}-${block.type}-${serialized}`;

          if (block.type === "paragraph") {
            return (
              <p key={key} className="opacity-90">
                {block.value as string}
              </p>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={key} className="list-disc space-y-2 pl-6">
                {(block.value as string[]).map((item) => (
                  <li key={`${key}-${item}`}>{item}</li>
                ))}
              </ul>
            );
          }
          if (block.type === "code") {
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-4 text-sm text-[var(--accent-cyan)]"
              >
                <code>{block.value as string}</code>
              </pre>
            );
          }
          return <Fragment key={key} />;
        })}
      </div>
      <aside className="card-base">
        <h2 className="pixel-text text-lg uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
          理性补充
        </h2>
        <p className="mt-3 text-sm opacity-80">
          每篇 Mind Dump 都支持导入 MDX
          文件。当前数据来自本地配置，未来可以接入文件系统或 CMS。
        </p>
      </aside>
    </article>
  );
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const entry = getMindDumpBySlug(params.slug);
  if (!entry) {
    return {
      title: "Mind Dump",
    };
  }
  return {
    title: `${entry.title} | Mind Dump`,
    description: entry.summary,
  };
}
