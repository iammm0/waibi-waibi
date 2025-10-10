"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Navigation from "@/components/navigation";
import NoiseLayer from "@/components/noise-layer";
import PageTransition from "@/components/page-transition";
import Footer from "@/components/site-footer";
import dynamic from "next/dynamic";

type VibeMode = "waibi" | "rational";
type MotionLevel = "wild" | "calm";

interface VibeContextValue {
  mode: VibeMode;
  motion: MotionLevel;
  toggleMode: () => void;
  toggleMotion: () => void;
}

const VibeContext = createContext<VibeContextValue | undefined>(undefined);

const MODE_KEY = "waibi-mode";
const MOTION_KEY = "waibi-motion";

// 语录仅在客户端渲染，避免影响 SSR 首帧一致性
const QuoteTicker = dynamic(() => import("@/components/quote-ticker"), {
  ssr: false,
});

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) throw new Error("useVibe must be used within <Providers>");
  return ctx;
}

export default function Providers({
                                    children,
                                    initialMode,
                                    initialMotion,
                                  }: {
  children: React.ReactNode;
  initialMode: VibeMode;      // 来自 SSR cookie
  initialMotion: MotionLevel; // 来自 SSR cookie
}) {
  // ⭐ 首帧严格使用 SSR 注入的值，保障 hydration 一致
  const [mode, setMode] = useState<VibeMode>(initialMode);
  const [motion, setMotion] = useState<MotionLevel>(initialMotion);

  // 首次挂载后与本地偏好进行对齐（有值则覆盖）
  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_KEY) as VibeMode | null;
    if (savedMode === "waibi" || savedMode === "rational") setMode(savedMode);

    const savedMotion = localStorage.getItem(MOTION_KEY) as MotionLevel | null;
    if (savedMotion === "wild" || savedMotion === "calm") {
      setMotion(savedMotion);
    } else if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setMotion("calm");
    }
  }, []);

  // 同步到 DOM / localStorage / cookie（供下次 SSR 使用）
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    localStorage.setItem(MODE_KEY, mode);
    document.cookie = `waibi-mode=${mode}; path=/; max-age=31536000`;
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
    localStorage.setItem(MOTION_KEY, motion);
    document.cookie = `waibi-motion=${motion}; path=/; max-age=31536000`;
  }, [motion]);

  const toggleMode = useCallback(
      () => setMode((prev) => (prev === "waibi" ? "rational" : "waibi")),
      [],
  );

  const toggleMotion = useCallback(
      () => setMotion((prev) => (prev === "wild" ? "calm" : "wild")),
      [],
  );

  const value = useMemo(
      () => ({ mode, motion, toggleMode, toggleMotion }),
      [mode, motion, toggleMode, toggleMotion],
  );

  return (
      <VibeContext.Provider value={value}>
        <NoiseLayer />
        <PageTransition />
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <QuoteTicker />
          <main className="flex-1" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </VibeContext.Provider>
  );
}
