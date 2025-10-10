"use client";

import Link from "next/link";
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
        <p className="pixel-text text-[0.6rem] uppercase tracking-[0.25em]">
          Waibi Waibi — 半疯半神、恶搞自嘲、混乱却克制。
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Link
            className="underline-offset-4 hover:underline"
            href="/mind-dump"
          >
            Mind Dump
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/projects">
            Projects
          </Link>
          <Link
            className="underline-offset-4 hover:underline"
            href="/mirror-room"
          >
            Mirror Room
          </Link>
          <Link
            className="underline-offset-4 hover:underline"
            href="/chaos-playground"
          >
            Chaos Playground
          </Link>
        </div>
      </div>
    </footer>
  );
}
