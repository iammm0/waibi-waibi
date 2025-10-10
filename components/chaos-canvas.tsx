"use client";

import { useEffect, useRef, useState } from "react";
import { useVibe } from "@/app/providers";

interface ChaosCanvasProps {
  reduced?: boolean;
}

export default function ChaosCanvas({ reduced = false }: ChaosCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [running, setRunning] = useState(true);
  const { motion } = useVibe();

  useEffect(() => {
    if (reduced || motion === "calm") {
      setRunning(false);
    } else {
      setRunning(true);
    }
  }, [reduced, motion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    const handleResize = () => {
      resize();
    };
    window.addEventListener("resize", handleResize);

    let tick = 0;

    const render = () => {
      if (!running) return;
      tick += 1;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 18; i += 1) {
        const angle = ((tick / 40 + i) * Math.PI) / 3;
        const radius =
          ((Math.sin(tick / (20 + i)) + 1) / 2) *
          Math.min(width, height) *
          0.45;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle * 1.2) * radius;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
        gradient.addColorStop(0, "rgba(21, 243, 255, 0.8)");
        gradient.addColorStop(1, "rgba(177, 121, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 30 + Math.sin(tick / 10 + i) * 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      animationRef.current = requestAnimationFrame(render);
    };

    if (running) {
      animationRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 text-white shadow-lg">
      <canvas
        ref={canvasRef}
        className="h-56 w-full rounded-xl bg-black/80 sm:h-72"
        role="img"
        aria-label="Chaos Playground 实验画布"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setRunning((prev) => !prev)}
          className="badge glitch-hover"
        >
          {running ? "降噪按钮" : "重新放电"}
        </button>
        <p className="opacity-70">
          {running ? "扫描线活跃中" : "已进入静默模式"}
        </p>
      </div>
    </div>
  );
}
