"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useVibe } from "@/app/providers";
import Logo from "./logo";

const navItems = [
  { href: "/", label: "发电留言板" },
  { href: "/mind-dump", label: "博客" },
  { href: "/projects", label: "项目" },
];

export default function Navigation() {
  const pathname = usePathname();
  const { mode, toggleMode } = useVibe();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const headerTone =
      mode === "waibi"
          ? "bg-black/60 text-white border-white/10"
          : "bg-white/80 text-black border-black/10";

  const mobileTone =
      mode === "waibi"
          ? "bg-black/70 border-white/10"
          : "bg-white/90 border-black/10";

  return (
      <header
          className={`sticky top-0 z-20 backdrop-blur border-b transition-colors ${headerTone}`}
          suppressHydrationWarning
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <Logo />
          </div>

          <nav className="flex items-center gap-3 text-xs sm:text-sm">
            <ul className="hidden items-center gap-3 md:flex">
              {navItems.map((item) => {
                const active = pathname === item.href;
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
                      >
                    <span className="pixel-text">
                      {item.label}
                      {active ? " ✦" : ""}
                    </span>
                      </Link>
                    </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2">
              <button
                  type="button"
                  onClick={toggleMode}
                  className="badge glitch-hover"
                  aria-pressed={mode === "waibi"}
                  aria-label="切换歪比/理智模式"
                  suppressHydrationWarning
              >
              <span className="pixel-text text-[0.65rem]" suppressHydrationWarning>
                {mode === "waibi" ? "切回理智" : "启用歪比"}
              </span>
              </button>
            </div>
          </nav>
        </div>

        {mounted && (
            <div className="md:hidden">
              <nav
                  className={`border-t px-6 py-3 text-xs transition-colors ${mobileTone}`}
                  suppressHydrationWarning
              >
                <ul className="grid grid-cols-2 gap-2">
                  {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <li key={item.href}>
                          <Link
                              href={item.href}
                              className={`glitch-hover block rounded-md border px-3 py-2 text-center font-semibold transition ${
                                  active
                                      ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)]"
                                      : "border-current/30 opacity-80 hover:opacity-100"
                              }`}
                          >
                      <span className="pixel-text text-[0.6rem]">
                        {item.label}
                      </span>
                          </Link>
                        </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
        )}
      </header>
  );
}
