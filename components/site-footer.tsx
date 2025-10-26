"use client";

import { useVibe } from "@/app/providers";

export default function Footer() {
    const { mode } = useVibe();
    const tone =
        mode === "waibi"
            ? "border-white/10 text-white"
            : "border-black/10 text-black";

    return (
        <footer className={`border-t px-6 py-6 text-sm transition-colors ${tone}`}>
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="items-center justify-center pixel-text text-[0.6rem] uppercase tracking-[0.25em]">
                    Waibi Waibi — 歪比巴布！
                </p>
                {/* 添加备案号 */}
                <p className="text-[0.6rem] text-center sm:text-left">
                    © 2025 Waibi Waibi | 备案号：<a href="http://www.beian.miit.gov.cn/" className="underline">豫ICP备2025117850号</a>
                </p>
            </div>
        </footer>
    );
}
