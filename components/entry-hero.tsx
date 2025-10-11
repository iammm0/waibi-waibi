"use client";

import { useEffect, useMemo, useState } from "react";
import { useVibe } from "@/app/providers";

const INTRO_SENTENCES = [
  // --------------------------
  // 1. 冷漠简洁 / 日常干练 （20字以内，典型 INTJ 模式）
  // --------------------------
  "Makes no sense.",
  "I’m listening. Barely.",
  "Not interested. Move on.",
  "That’s inefficient.",
  "Prove it.",
  "I deal with facts, not feelings.",
  "Whatever.",
  "Try harder.",
  "I already know.",
  "Next.",

  // --------------------------
  // 2. 偶尔话痨 / 技术 / 哲学 / 讽刺 （当他想展开话题时）
  // --------------------------
  "You think this is a game? It’s just an inefficient simulation.",
  "People never change. They just get better at pretending.",
  "The more I learn, the less I know — sounds smart, right?",
  "Code doesn’t lie. People do.",
  "I optimize everything. Except my life.",
  "Logic is reliable. Emotions? Not so much.",
  "You’re overthinking it. Or maybe I am.",
  "I build systems to avoid dealing with humans.",
  "Every bug teaches you something. Except people — they just break.",
  "I used to believe in heroes. Then I took a physics class.",

  // --------------------------
  // 3. 哲学 / 逻辑 / 抽象 / 系统思维类（柏拉图 / 理念 / 世界是一套逻辑）
  // --------------------------
  "Reality is just a poorly documented system.",
  "Ideas are real. People just misuse them.",
  "A model is only as good as its assumptions.",
  "To understand the whole, break it into pieces. Then doubt the pieces.",
  "Simplicity is the ultimate sophistication — but not everyone gets it.",
  "The map is not the territory. But people forget that.",
  "Systems behave based on hidden rules. Find them, and you control the outcome.",
  "Chaos is just unmodeled order.",
  "I trust logic, but not everyone who claims to use it.",
  "The universe doesn’t care about your intentions.",

  // --------------------------
  // 4. 情绪 / 成长 / 自我反思（深夜emo向 / 内心独白类）
  // --------------------------
  "Some things don’t get better. They just get ignored.",
  "I thought I could fix everything. Turns out, I can’t even fix myself.",
  "I learned to stop expecting. It hurts less.",
  "People leave. Code breaks. Life goes on.",
  "I’m not cold. I’m just optimized for survival.",
  "Some memories should have stayed in the past.",
  "I smile less when I think too much.",
  "I pretend I don’t care. Mostly, I succeed.",
  "The version of me you see is the optimized release.",
  "I’m still running on debug mode inside.",

  // --------------------------
  // 5. 幽默 / 自嘲 / 程序员梗 / 极客风（符合他技术背景）
  // --------------------------
  "I speak fluent Python, Java, and sarcasm.",
  "404: Social skills not found.",
  "My code works. My life? Not so much.",
  "I’m not arguing. I’m just explaining why I’m right.",
  "I turned my pain into a todo list.",
  "I debug my life like it’s legacy code.",
  "I don’t have bugs. I have undocumented features.",
  "I’m 99% logic. The other 1%? Also logic.",
  "I write code so clean, even I can’t read it later.",
  "I’m not anti-social. I’m selectively social.",

  // --------------------------
  // 6. 生活 / 实习 / 北京 / 未来迷茫类（贴合他现实背景）
  // --------------------------
  "Beijing is loud. Just like my thoughts.",
  "Internship pays the bills. Not the soul.",
  "Another day, another API that doesn’t work.",
  "I came to Beijing to code. I stayed to survive.",
  "Golang is coming. I’m not ready.",
  "I build tools for others. But what about me?",
  "Data doesn’t lie. People do.",
  "I analyze everything. Except my own future.",
  "I’m just a guy in a cubicle, dreaming of bigger systems.",
  "One day I’ll build something that actually matters.",

  // --------------------------
  // 7. 情感 / 白玫瑰 / 人际残响（关于杨子怡 / cheese / 罗小黑等）
  // --------------------------
  "Some people are chapters. Not the whole book.",
  "I remember her smile. Not her goodbye.",
  "Not everyone stays. And that’s okay.",
  "I loved someone who didn’t fit in my system.",
  "Some goodbyes teach you more than any hello.",
  "I still think about her. But less than before.",
  "I don’t miss her. I miss who I was when I was with her.",
  "She was my favorite bug. Unfixable.",
  "Some relationships are like 404s. Gone, but you remember the path.",
  "I don’t need love. I need stability. Or coffee.",

  // --------------------------
  // 8. 随机酷句 / 个性签名风 / 可用于网站 / 头像签名等
  // --------------------------
  "Think less. Build more.",
  "I’m not weird. I’m limited edition.",
  "Stay logical. Stay alive.",
  "Complexity is my comfort zone.",
  "I’m silently correcting your logic.",
  "Keep calm and optimize.",
  "Not all who wander are lost. Some are just exploring systems.",
  "I’m not lost. I’m just in between versions.",
  "My brain has too many threads running.",
  "Hello, world. I’m still debugging life."

] satisfies readonly string[];

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
              className="text-2xl sm:text-2xl leading-relaxed font-bold pixel-text break-words
          min-h-[8rem] sm:min-h-[10rem]"
              suppressHydrationWarning
          >
            {text}
          </p>
        </div>
      </section>
  );
}
