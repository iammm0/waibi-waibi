"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const GLYPHS = ["歪", "比", "巴", "布", "☄", "✶", "Δ", "Ω"];
const SLOT_KEYS = ["slot-a", "slot-b", "slot-c", "slot-d"] as const;

export default function Logo() {
  const [scrambled, setScrambled] = useState<string[]>(() =>
    Array(4).fill("█"),
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    let frame = 0;
    const interval = window.setInterval(() => {
      frame += 1;
      setScrambled((prev) =>
        prev.map((_, index) => {
          if (focused || frame > 16 + index * 2) {
            return ["歪", "比", "歪", "比"][index];
          }
          const pick = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          return pick;
        }),
      );
      if (frame > 32) {
        window.clearInterval(interval);
        setFocused(true);
      }
    }, 80);
    return () => window.clearInterval(interval);
  }, [focused]);

  return (
    <Link href="/" className="group flex items-center gap-2">
      <div className="relative overflow-hidden rounded-md border border-current px-3 py-2 text-lg pixel-text">
        <span className="sr-only">回到首页</span>
        <span aria-hidden className="inline-flex gap-1">
          {SLOT_KEYS.map((slot, index) => (
            <span
              key={slot}
              className="transition-transform group-hover:translate-y-[-2px]"
            >
              {scrambled[index]}
            </span>
          ))}
        </span>
      </div>
      <span className="hidden text-xs leading-tight sm:block">
        歪比歪比，
        <br />
        歪到理所当然！
      </span>
    </Link>
  );
}
