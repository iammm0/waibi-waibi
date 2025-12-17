// providers.tsx
"use client";

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from "react";
import NoiseLayer from "@/components/noise-layer";
import PageTransition from "@/components/page-transition";
import Navigation from "@/components/navigation";
import Footer from "@/components/site-footer";

type VibeMode = "waibi" | "rational";

interface VibeContextValue {
  mode: VibeMode;
  toggleMode: () => void;
}

const VibeContext = createContext<VibeContextValue | undefined>(undefined);

const MODE_KEY = "waibi-mode";

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) throw new Error("useVibe must be used within <Providers>");
  return ctx;
}

export default function Providers({
                                    children,
                                    initialMode = "rational", // 默认值，可硬编码
                                  }: {
  children: React.ReactNode;
  initialMode?: VibeMode;
}) {
  // 从 HTML 的 data-mode 属性读取初始值（由内联脚本设置）
  const getInitialMode = (): VibeMode => {
    if (typeof window !== "undefined") {
      const htmlMode = document.documentElement.getAttribute('data-mode');
      if (htmlMode === "waibi" || htmlMode === "rational") {
        return htmlMode;
      }
      const savedMode = localStorage.getItem(MODE_KEY) as VibeMode | null;
      if (savedMode === "waibi" || savedMode === "rational") {
        return savedMode;
      }
    }
    return initialMode;
  };

  const [mode, setMode] = useState<VibeMode>(getInitialMode);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      html.dataset.mode = mode;
      // 将 Tailwind 的 dark 变体与自定义模式联动
      if (mode === "waibi") {
        html.classList.add("dark");
        // 提示浏览器配色方案，改善表单控件/滚动条等系统色
        html.style.colorScheme = "dark";
      } else {
        html.classList.remove("dark");
        html.style.colorScheme = "light";
      }
      localStorage.setItem(MODE_KEY, mode);
    }
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "waibi" ? "rational" : "waibi"));
  }, []);

  const value = useMemo(
      () => ({ mode, toggleMode }),
      [mode, toggleMode]
  );

  return (
      <VibeContext.Provider value={value}>
        <NoiseLayer />
        <PageTransition />
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </VibeContext.Provider>
  );
}