"use client";

import { useState } from "react";
import ChaosCanvas from "@/components/chaos-canvas";
import SectionHeader from "@/components/section-header";

export default function ChaosPlaygroundPage() {
  const [reduced, setReduced] = useState(false);

  return (
    <div className="space-y-10">
      <SectionHeader
        title="Chaos Playground"
        subtitle="炫技实验室。WebGL、Canvas 与噪点混合的微型实验，入场需要一点点勇气。"
        actions={
          <button
            type="button"
            className="badge glitch-hover"
            onClick={() => setReduced((prev) => !prev)}
          >
            {reduced ? "恢复电流" : "降噪模式"}
          </button>
        }
      />
      <ChaosCanvas reduced={reduced} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-base space-y-3 text-sm leading-relaxed">
          <h2 className="pixel-text text-lg uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
            技术清单
          </h2>
          <p>
            Canvas 2D + requestAnimationFrame + 设备像素比自适应，保持帧率稳定。
          </p>
          <p>降噪模式会暂停动画并保留最后一帧，以兼顾性能与叙事感。</p>
        </div>
        <div className="card-base space-y-3 text-sm leading-relaxed">
          <h2 className="pixel-text text-lg uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
            扩展计划
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>接入 ShaderToy 风格的片段着色器模式，支持 JSON 描述场景。</li>
            <li>允许从外部数据源注入频谱，和音乐联动。</li>
            <li>为移动端提供轻量粒子替代，保持 60fps。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
