"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// 中文与英文目标序列（逐位对应）
const CN_TARGET = ["歪", "比", "巴", "布"];
const EN_TARGET = ["W", "A", "I", "B"];

// 混乱符号池
const GLYPHS = ["歪", "比", "巴", "布", "W", "A", "I", "B", "Ω", "Δ", "✶", "☄", "Ψ", "Φ", "∇", "☆"];

const SCRAMBLE_INTERVAL_MS = 60;   // 每帧间隔
const SCRAMBLE_DURATION_MS = 600;  // 每次乱码持续时间
const CYCLE_MS = 2000;             // 每 2 秒触发一轮

export default function Logo() {
    const [chars, setChars] = useState<string[]>(CN_TARGET);
    const [langIsCN, setLangIsCN] = useState(true);
    const scrambleTimer = useRef<number | null>(null);
    const cycleTimer = useRef<number | null>(null);

    /** 触发一次“切换语言 + 乱序动画” */
    const runScrambleOnce = () => {
        if (scrambleTimer.current) window.clearInterval(scrambleTimer.current);
        const start = Date.now();
        const nextLangIsCN = !langIsCN;
        const nextTarget = nextLangIsCN ? CN_TARGET : EN_TARGET;

        scrambleTimer.current = window.setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = Math.min(1, elapsed / SCRAMBLE_DURATION_MS);

            setChars((prev) =>
                prev.map((_, i) => {
                    const settleAt = 0.3 + i * 0.15; // 每个字符错峰归位
                    if (progress >= settleAt) return nextTarget[i];
                    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                }),
            );

            if (elapsed >= SCRAMBLE_DURATION_MS) {
                if (scrambleTimer.current) window.clearInterval(scrambleTimer.current);
                setChars([...nextTarget]);
                setLangIsCN(nextLangIsCN);
            }
        }, SCRAMBLE_INTERVAL_MS);
    };

    useEffect(() => {
        runScrambleOnce(); // 初次挂载时触发
        cycleTimer.current = window.setInterval(runScrambleOnce, CYCLE_MS);
        return () => {
            if (cycleTimer.current) window.clearInterval(cycleTimer.current);
            if (scrambleTimer.current) window.clearInterval(scrambleTimer.current);
        };
    }, []);

    const hoverTrigger = () => runScrambleOnce();

    return (
        <Link
            href="/"
            className="group flex items-center gap-2"
            onMouseEnter={hoverTrigger}
            onFocus={hoverTrigger}
        >
            <div className="relative overflow-hidden px-2 py-1 text-xl sm:text-2xl font-bold pixel-text text-[var(--accent-cyan)]">
                <span className="sr-only">回到首页</span>
                <span
                    aria-hidden
                    className="inline-flex gap-1 transition-all group-hover:text-[var(--accent-purple)]"
                >
          {chars.map((c, i) => (
              <span
                  key={i}
                  className="inline-block transition-transform duration-150 group-hover:-translate-y-[2px]"
              >
              {c}
            </span>
          ))}
        </span>
            </div>
        </Link>
    );
}
