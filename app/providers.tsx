// providers.tsx
"use client";

import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from "react";
import NoiseLayer from "@/components/noise-layer";
import PageTransition from "@/components/page-transition";
import Navigation from "@/components/navigation";
import Footer from "@/components/site-footer";

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

export function useVibe() {
  const ctx = useContext(VibeContext);
  if (!ctx) throw new Error("useVibe must be used within <Providers>");
  return ctx;
}

export default function Providers({
                                    children,
                                    initialMode = "rational", // 默认值，可硬编码
                                    initialMotion = "wild",    // 默认值，可硬编码
                                  }: {
  children: React.ReactNode;
  initialMode?: VibeMode;
  initialMotion?: MotionLevel;
}) {
  const [mode, setMode] = useState<VibeMode>(initialMode);
  const [motion, setMotion] = useState<MotionLevel>(initialMotion);

  useEffect(() => {
    // 仅在客户端读取 localStorage
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem(MODE_KEY) as VibeMode | null;
      if (savedMode === "waibi" || savedMode === "rational") {
        setMode(savedMode);
      }

      const savedMotion = localStorage.getItem(MOTION_KEY) as MotionLevel | null;
      if (savedMotion === "wild" || savedMotion === "calm") {
        setMotion(savedMotion);
      } else if (
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setMotion("calm");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.dataset.mode = mode;
      localStorage.setItem(MODE_KEY, mode);
    }
  }, [mode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.dataset.motion = motion;
      localStorage.setItem(MOTION_KEY, motion);
    }
  }, [motion]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "waibi" ? "rational" : "waibi"));
  }, []);

  const toggleMotion = useCallback(() => {
    setMotion((prev) => (prev === "wild" ? "calm" : "wild"));
  }, []);

  const value = useMemo(
      () => ({ mode, motion, toggleMode, toggleMotion }),
      [mode, motion, toggleMode, toggleMotion]
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