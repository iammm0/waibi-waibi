"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useVibe } from "@/app/providers";

const INTRO_SENTENCES = [
  "歪比巴布！欢迎来到我的脑壳里。",
  "半疯半神的项目在此排队等位。",
  "如果宇宙不同意，记得点右上角冷静开关。",
];

const SECTION_LINKS = [
  { href: "/mind-dump", label: "Mind Dump", description: "精神溢出区：胡言乱语与技术哼唱" },
  { href: "/projects", label: "Projects", description: "狠活展示区：荒诞电梯陈述" },
  { href: "/chaos-playground", label: "Playground", description: "炫技实验室：三十秒内惊艳你" },
];

function scrambleText(target: string, progress: number) {
  const glyphs = "█▚▞▛ΔΩ✶☄";
  return target
      .split("")
      .map((char, index) => {
        if (char === "\n" || char === " ") return char;
        if (index / target.length < progress) return char;
        // ⚠️ 仅在客户端挂载后才会调用到这里
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      })
      .join("");
}

export default function EntryHero() {
  const [mounted, setMounted] = useState(false);        // ⭐ 挂载门：SSR 首帧不做随机
  const [progress, setProgress] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const { mode } = useVibe();

  useEffect(() => {
    setMounted(true); // 首次挂载
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const interval = window.setInterval(() => {
      setProgress((prev) => Math.min(1, prev + 0.08));
    }, 60);

    const quoteInterval = window.setInterval(() => {
      setSentenceIndex((prev) => (prev + 1) % INTRO_SENTENCES.length);
      setProgress(0);
    }, 6200);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(quoteInterval);
    };
  }, [mounted]);

  const base = INTRO_SENTENCES[sentenceIndex];

  // ⭐ 未挂载：返回明文（与 SSR 一致）；已挂载：才进行随机扰动
  const text = useMemo(
      () => (mounted ? scrambleText(base, progress) : base),
      [mounted, base, progress]
  );

  const tone =
      mode === "waibi"
          ? "border-white/10 bg-black/60 text-white"
          : "border-black/10 bg-white/80 text-black";

  return (
      <section
          className={`entry-hero mb-12 flex flex-col gap-8 rounded-3xl p-8 shadow-[0_0_30px_rgba(21,243,255,0.2)] transition-colors ${tone}`}
      >
        <div className="flex flex-col gap-4">
          <p className="pixel-text text-[0.8rem] uppercase tracking-[0.5em] text-[var(--accent-cyan)]">
            Waibi babu! Where chaos meets creation.
          </p>
          <h1 className="text-4xl sm:text-5xl">
            半疯半神 · 恶搞自嘲 · 混乱却克制
          </h1>
          {/* suppressHydrationWarning 防止挂载后字形变化的提示，但关键在于首帧文本一致 */}
          <p className="text-base leading-relaxed" suppressHydrationWarning>
            {text}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {SECTION_LINKS.map((link) => (
              <Link
                  key={link.href}
                  href={link.href}
                  className="card-base glitch-hover flex flex-col gap-2 text-sm"
              >
            <span className="pixel-text text-sm uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
              {link.label}
            </span>
                <span className="text-sm opacity-80">{link.description}</span>
                <span className="pixel-text text-[0.6rem] uppercase tracking-[0.3em]">
              进入
            </span>
              </Link>
          ))}
        </div>
      </section>
  );
}
