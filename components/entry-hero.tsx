"use client";

import { useEffect, useMemo, useState } from "react";
import { INTRO_SENTENCES } from "@/lib/intro-sentences";

// 随机打乱文本的函数
function scrambleText(target: string, progress: number) {
    const glyphs = "█▚▞▛ΔΩ✶☄";

    return target
        .split("")
        .map((char, index) => {
            if (char === "\n" || char === " ") return char;
            if (index / target.length < progress) return char;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
        })
        .join("");
}

export default function EntryHero() {
    const [sentenceIndex, setSentenceIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [mounted, setMounted] = useState(false);

    // 初始化组件
    useEffect(() => {
        setMounted(true);
        if (INTRO_SENTENCES.length === 0) return;

        // 随机选择一句话
        const randomIndex = Math.floor(Math.random() * INTRO_SENTENCES.length);
        setSentenceIndex(randomIndex);

        // 设置进度条动画
        const interval = setInterval(() => setProgress((p) => Math.min(1, p + 0.08)), 80);
        const quoteInterval = setInterval(() => {
            setSentenceIndex(Math.floor(Math.random() * INTRO_SENTENCES.length));
            setProgress(0);
        }, 6200);

        return () => {
            clearInterval(interval);
            clearInterval(quoteInterval);
        };
    }, [mounted]);

    // 获取当前要显示的句子
    const baseSentence = INTRO_SENTENCES[sentenceIndex] || "";

    // 根据进度打乱文本
    const text = useMemo(() => (mounted ? scrambleText(baseSentence, progress) : baseSentence), [mounted, baseSentence, progress]);

    // 设置字体为自定义英文字体
    return (
        <section>
            <p className="text-2xl font-[Press Start 2P]">
                {text}
            </p>
        </section>
    );
}