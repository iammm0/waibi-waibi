"use client";

import { useVibe } from "@/app/providers";
import Link from "next/link";

export default function Footer() {
    const { mode } = useVibe();
    const tone =
        mode === "waibi"
            ? "border-white/10 text-white"
            : "border-black/10 text-black";
    const linkClass = mode === "waibi"
        ? "hover:text-green-400 transition-colors"
        : "hover:text-[var(--accent-cyan)] transition-colors";

    return (
        <footer className={`border-t px-6 py-6 text-sm transition-colors ${tone}`}>
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="pixel-text text-[0.6rem] uppercase tracking-[0.25em] text-center sm:text-left">
                    Waibi Waibi !
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    {/* 支持链接 */}
                    <Link 
                        href="/support" 
                        className={`text-[0.6rem] ${linkClass} flex items-center gap-1`}
                    >
                        <span>☕</span>
                        <span>支持开发者</span>
                    </Link>
                    {/* 添加备案号 */}
                    <p className="text-[0.6rem] text-center sm:text-left">
                        © 2025 歪比宇宙 | 备案号：<a href="http://www.beian.miit.gov.cn/" className="underline">豫ICP备2025117850号</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
