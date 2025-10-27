"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useVibe } from "@/app/providers";
import Logo from "./logo";
import { FaMoon, FaSun } from "react-icons/fa";
import Link from "next/link";

const navItems = [
  { href: "/", label: "发电留言板" },
  { href: "/chat", label: "聊一聊" },
  { href: "/mbti", label: "人格模拟" },
];

// 随机打乱文本
function scrambleText(target: string, progress: number) {
  const glyphs = "█▚▞▛ΔΩ✶☄";
  return target
      .split("")
      .map((char, index) => {
        if (char === " " || char === "\n") return char;
        if (index / target.length < progress) return char;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      })
      .join("");
}

export default function Navigation() {
  const pathname = usePathname();
  const { mode, toggleMode } = useVibe();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const handleScramble = (href: string) => {
    if (activeIndex === href) return;
    setActiveIndex(href);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(interval);
          return 1;
        }
        return p + 0.05;
      });
    }, 50);
  };

  const headerTone =
      mode === "waibi"
          ? "bg-black/60 text-white border-white/10"
          : "bg-white/80 text-black border-black/10";

  const buttonTone =
      mode === "waibi"
          ? "border-white/30 hover:border-white/60"
          : "border-black/30 hover:border-black/60";

  return (
      <header
          className={`sticky top-0 z-20 backdrop-blur border-b transition-colors ${headerTone}`}
          suppressHydrationWarning
      >
        {/* 第一行：Logo + 桌面导航 + 主题按钮 */}
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo />
          </div>

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center gap-3 text-sm">
            <ul className="flex items-center gap-3">
              {navItems.map((item) => {
                const active = pathname === item.href || activeIndex === item.href;
                const text =
                    active && mounted
                        ? scrambleText(item.label, progress)
                        : item.label;

                return (
                    <li key={item.href}>
                      <Link
                          href={item.href}
                          className={`glitch-hover relative px-2 py-1 font-semibold transition-opacity ${
                              active
                                  ? "text-[var(--accent-cyan)]"
                                  : "opacity-70 hover:opacity-100"
                          }`}
                          aria-current={active ? "page" : undefined}
                          onMouseEnter={() => handleScramble(item.href)}
                      >
                        <span className="pixel-text">{text}</span>
                        {active && " ✦"}
                      </Link>
                    </li>
                );
              })}
            </ul>
          </nav>

          {/* 主题切换按钮（移动端与桌面端都显示） */}
          <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={toggleMode}
                className="badge glitch-hover flex items-center gap-2"
                aria-pressed={mode === "waibi"}
                aria-label="切换歪比/理智模式"
                suppressHydrationWarning
            >
              {mode === "waibi" ? <FaSun className="text-l" /> : <FaMoon className="text-l" />}
            </button>
          </div>
        </div>

        {/* 二级 Header（仅移动端显示）：自动排列充满 + 小圆角 */}
        <div className={`sm:hidden border-t ${headerTone}`}>
          <ul className="mx-auto flex w-full max-w-[1200px] flex-wrap gap-2 px-6 py-3">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                  <li key={item.href} className="flex-1">
                    <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          // 按钮基样式：小圆角 + 描边 + 居中 + 自适应宽度
                          "block rounded-md border px-3 py-2 text-center text-xs font-semibold",
                          "pixel-text uppercase tracking-[0.08em]",
                          // 颜色随主题 & 选中态
                          active
                              ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)]"
                              : `${buttonTone} opacity-90 hover:opacity-100`,
                        ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  </li>
              );
            })}
          </ul>
        </div>
      </header>
  );
}
