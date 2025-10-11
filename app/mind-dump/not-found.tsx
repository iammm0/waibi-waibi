import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="pixel-text text-4xl">页面漂流到宇宙边缘</h1>
      <p className="max-w-lg text-sm opacity-80">
          你访问的内容暂时不存在。mind-dumps 宇宙似乎还没开启。点击下方按钮即可回到主宇宙时间线。
      </p>
      <Link href="/" className="badge glitch-hover text-base">
        回到首页
      </Link>
    </div>
  );
}
