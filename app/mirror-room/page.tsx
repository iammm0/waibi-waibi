"use client";

import { useEffect, useState } from "react";
import { useVibe } from "@/app/providers";
import MirrorPanel from "@/components/mirror-panel";
import SectionHeader from "@/components/section-header";
import { mirrorPrompts } from "@/data/mirror-room";

export default function MirrorRoomPage() {
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const { motion } = useVibe();
  const current = mirrorPrompts[typingIndex % mirrorPrompts.length];

  useEffect(() => {
    setDisplayText("");
    if (motion === "calm") {
      setDisplayText(current.reflection);
      return;
    }
    let index = 0;
    const text = current.reflection;
    const timer = window.setInterval(() => {
      setDisplayText(text.slice(0, index + 1));
      index += 1;
      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, 40);
    const rotate = window.setTimeout(() => {
      setTypingIndex((prev) => (prev + 1) % mirrorPrompts.length);
    }, 9000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(rotate);
    };
  }, [current.reflection, motion]);

  return (
    <div className="space-y-12">
      <SectionHeader
        title="Mirror Room"
        subtitle="自我解构室。左右两侧的我互相盘问，偶尔翻译成理智语句。"
      />
      <div className="space-y-6">
        {mirrorPrompts.map((prompt) => (
          <MirrorPanel key={prompt.id} prompt={prompt} />
        ))}
      </div>
      <aside className="card-base space-y-3">
        <h2 className="pixel-text text-lg uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
          Typing Reflection
        </h2>
        <p className="text-sm leading-relaxed">
          {displayText || current.reflection}
        </p>
        <p className="text-xs opacity-70">
          上述文字以打字机节奏轮播，若想关闭请在顶部切换“冷静开关”。
        </p>
      </aside>
    </div>
  );
}
