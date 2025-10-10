export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="pixel-text text-sm uppercase tracking-[0.4em] text-[var(--accent-cyan)]">
        正在校准宇宙频率
      </p>
      <p className="text-base opacity-80">骨架屏加载中，请原谅短暂的理智。</p>
      <div className="grid w-full max-w-xl gap-3">
        {["prelude", "stack", "glitch", "epilogue"].map((token) => (
          <div
            key={token}
            className="h-12 animate-pulse rounded-xl bg-white/10"
          />
        ))}
      </div>
    </div>
  );
}
