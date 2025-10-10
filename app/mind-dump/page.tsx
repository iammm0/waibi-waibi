"use client";

import { useMemo, useState } from "react";
import MindDumpCard from "@/components/mind-dump-card";
import SectionHeader from "@/components/section-header";
import { getMindDumpPreview } from "@/data/mind-dump";

const previews = getMindDumpPreview();
const allTags = Array.from(
  new Set(previews.flatMap((entry) => entry.tags)),
).sort();

export default function MindDumpPage() {
  const [tag, setTag] = useState<string | null>(null);
  const filtered = useMemo(() => {
    if (!tag) return previews;
    return previews.filter((entry) => entry.tags.includes(tag));
  }, [tag]);

  return (
    <div>
      <SectionHeader
        title="Mind Dump"
        subtitle="精神溢出区。你看到的是荒诞诗稿与技术日志的折衷产物，每篇都附赠一支“歪比指数”。"
        actions={
          <div className="flex items-center gap-3 text-sm">
            <label
              htmlFor="tag-filter"
              className="pixel-text text-[0.6rem] uppercase tracking-[0.3em]"
            >
              过滤标签
            </label>
            <select
              id="tag-filter"
              className="rounded-md border border-current/40 bg-transparent px-3 py-2 text-xs"
              value={tag ?? ""}
              onChange={(event) => setTag(event.target.value || null)}
            >
              <option value="">全部</option>
              {allTags.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <div className="section-grid">
        {filtered.map((entry) => (
          <MindDumpCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </div>
  );
}
