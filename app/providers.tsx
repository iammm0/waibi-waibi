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
import QuoteTicker from "@/components/quote-ticker";
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
  if (!ctx) {
    throw new Error("useVibe must be used within VibeProvider");
  }
  return ctx;
}

function getInitialMode(): VibeMode {
  if (typeof window === "undefined") return "waibi";
  return (localStorage.getItem(MODE_KEY) as VibeMode) ?? "waibi";
}

function getInitialMotion(): MotionLevel {
  if (typeof window === "undefined") return "wild";
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReduced) return "calm";
  return (localStorage.getItem(MOTION_KEY) as MotionLevel) ?? "wild";
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<VibeMode>(() => getInitialMode());
  const [motion, setMotion] = useState<MotionLevel>(() => getInitialMotion());

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
    localStorage.setItem(MOTION_KEY, motion);
  }, [motion]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "waibi" ? "rational" : "waibi"));
  }, []);

  const toggleMotion = useCallback(() => {
    setMotion((prev) => (prev === "wild" ? "calm" : "wild"));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      motion,
      toggleMode,
      toggleMotion,
    }),
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
