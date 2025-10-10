"use client";

import { useEffect, useMemo, useState } from "react";
import { useVibe } from "@/app/providers";
import { getRandomQuote, type WaibiQuote } from "@/data/quotes";

const FAVORITES_KEY = "waibi-favorites";

function loadFavorites(): WaibiQuote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WaibiQuote[];
  } catch (error) {
    console.warn("Failed to load favorites", error);
    return [];
  }
}

function saveFavorites(quotes: WaibiQuote[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(quotes));
}

export default function QuoteTicker() {
  const [quote, setQuote] = useState<WaibiQuote>(() => getRandomQuote());
  const [favorites, setFavorites] = useState<WaibiQuote[]>([]);
  const [copied, setCopied] = useState(false);
  const { mode } = useVibe();

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(
      () => {
        setQuote((current) => getRandomQuote(current.seed));
      },
      8000 + Math.random() * 4000,
    );
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCollect = () => {
    setFavorites((prev) => {
      if (prev.some((item) => item.seed === quote.seed)) {
        return prev;
      }
      const updated = [...prev, quote];
      saveFavorites(updated);
      return updated;
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(quote.text);
      setCopied(true);
    } catch (error) {
      console.warn("copy failed", error);
    }
  };

  const tone = useMemo(
    () =>
      mode === "waibi"
        ? "border-white/10 bg-black/40 text-white"
        : "border-black/10 bg-white/80 text-black",
    [mode],
  );

  return (
    <aside className={`border-b text-xs transition-colors ${tone}`}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2">
          <span className="pixel-text text-[0.6rem] uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
            歪语注入
          </span>
          <p className="text-sm sm:text-base">
            <span className="font-semibold">“{quote.text}”</span>
            <span className="ml-2 text-[0.65rem] uppercase tracking-[0.2em] opacity-70">
              #{quote.mood}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.7rem]">
          <button
            type="button"
            className="badge glitch-hover"
            onClick={handleCopy}
          >
            {copied ? "已复制" : "复制梗句"}
          </button>
          <button
            type="button"
            className="badge glitch-hover"
            onClick={handleCollect}
          >
            收藏歪言（{favorites.length}）
          </button>
        </div>
      </div>
    </aside>
  );
}
