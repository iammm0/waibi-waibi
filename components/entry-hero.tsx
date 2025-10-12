"use client";

import { useEffect, useMemo, useState } from "react";
import { useVibe } from "@/app/providers";
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
    const [isEnglish, setIsEnglish] = useState(true); // 默认显示英文
    const [sentenceIndex, setSentenceIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [mounted, setMounted] = useState(false);
    const { mode } = useVibe();

    // 切换语言
    // const handleLanguageToggle = () => {
    //     setIsEnglish((prevState) => !prevState);
    // };

    // 根据当前语言切换显示英文或中文
    // const sentenceToDisplay = isEnglish
    //     ? INTRO_SENTENCES[sentenceIndex]
    //     : TRANSLATIONS[INTRO_SENTENCES[sentenceIndex]];

    // 初始化组件
    useEffect(() => {
        setMounted(true);
        if (INTRO_SENTENCES.length === 0) return;

        // 随机选择一句话
        const randomIndex = Math.floor(Math.random() * INTRO_SENTENCES.length);
        setSentenceIndex(randomIndex);

        // 设置进度条动画
        const interval = setInterval(() => setProgress((p) => Math.min(1, p + 0.08)), 60);
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
    const text = useMemo(() => (mounted ? scrambleText(baseSentence, progress) : baseSentence), [mounted, baseSentence, progress]);

    // 根据模式设置样式
    const tone = mode === "waibi" ? "border-white/10 bg-black/60 text-white" : "border-black/10 bg-white/80 text-black";

    return (
        <section>
            {/* 显示随机渲染的句子 */}
            <p className="text-2xl">
                {text}
            </p>
            {/* 浮动按钮，右下角切换语言 */}
            {/*<button*/}
            {/*    onClick={handleLanguageToggle}*/}
            {/*    className="fixed bottom-25 right-4 p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors"*/}
            {/*>*/}
            {/*    /!* 使用 GlobeAltIcon 图标 *!/*/}
            {/*    <GlobeAltIcon className="h-4 w-4" />*/}
            {/*</button>*/}
        </section>
    );
}
