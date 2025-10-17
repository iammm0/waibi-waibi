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
  const [mode, setMode] = useState<VibeMode>(initialMode);

  useEffect(() => {
    // 仅在客户端读取 localStorage
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem(MODE_KEY) as VibeMode | null;
      if (savedMode === "waibi" || savedMode === "rational") {
        setMode(savedMode);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.dataset.mode = mode;
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