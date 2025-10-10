"use client";

import { useEffect, useMemo, useState } from "react";
import { useVibe } from "@/app/providers";

const INTRO_SENTENCES = [
  "You！Son of Bitches！",
  "歪比歪比！歪比巴布！",
  "欢迎来到我的脑壳里。",
    "Nice!",
  "Hello！Crazy world!",
  "Oh! Crazy Bitch!",
  "愿我的家人，朋友，老师还有同学都能做自己生活的冠军！",
  "爱你老妈！明天见！",
  "子豪君！",
  "Damn it! Mother fucker?",
  "江云兄！士别三日，当刮目相看！",
    "都叫兄弟了！那还说啥~"
]  satisfies string[];

function scrambleText(target: unknown, progress: number) {
  // ✅ 强制兜底为字符串，避免 undefined.split
  const safe = typeof target === "string" ? target : String(target ?? "");
  const glyphs = "█▚▞▛ΔΩ✶☄";

  if (!safe) return ""; // 空串直接返回

  return safe
      .split("")
      .map((char, index) => {
        if (char === "\n" || char === " ") return char;
        if (index / safe.length < progress) return char;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      })
      .join("");
}

export default function EntryHero() {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const { mode } = useVibe();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    // ✅ 若数组为空，不设定任何轮播/进度
    if (INTRO_SENTENCES.length === 0) return;

    const interval = window.setInterval(
        () => setProgress((p) => Math.min(1, p + 0.08)),
        60
    );

    const quoteInterval = window.setInterval(() => {
      setSentenceIndex((i) => ((i + 1) % INTRO_SENTENCES.length + INTRO_SENTENCES.length) % INTRO_SENTENCES.length);
      setProgress(0);
    }, 6200);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(quoteInterval);
    };
  }, [mounted]);

  // ✅ 安全取值：越界或空数组时给空串
  const base =
      INTRO_SENTENCES.length > 0 && sentenceIndex >= 0 && sentenceIndex < INTRO_SENTENCES.length
          ? INTRO_SENTENCES[sentenceIndex]
          : "";

  const text = useMemo(
      () => (mounted ? scrambleText(base, progress) : base ?? ""),
      [mounted, base, progress]
  );

  const tone =
      mode === "waibi"
          ? "border-white/10 bg-black/60 text-white"
          : "border-black/10 bg-white/80 text-black";

  return (
      <section
          className={`entry-hero mb-12 flex items-center justify-center text-center rounded-3xl p-8 shadow-[0_0_30px_rgba(21,243,255,0.2)] transition-colors ${tone}
      min-h-[32vh] sm:min-h-[36vh]`}
      >
        <div className="flex flex-col gap-4 items-center justify-center max-w-3xl mx-auto">
          <p
              className="text-4xl sm:text-5xl leading-relaxed font-bold pixel-text break-words
          min-h-[8rem] sm:min-h-[10rem]"
              suppressHydrationWarning
          >
            {text}
          </p>
        </div>
      </section>
  );
}
