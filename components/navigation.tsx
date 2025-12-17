"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useVibe } from "@/app/providers";
import Link from "next/link";
import { MdDarkMode, MdLightMode } from "react-icons/md";

const navItems = [
  { href: "/", label: "训练" },
  { href: "/instances", label: "开放实例" },
  { href: "/chat", label: "聊一聊" },
];

type Me = { user: { userId: string; username?: string; name?: string; avatarUrl?: string } };

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggleMode } = useVibe();
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) { 
      setMe(null); 
      return; 
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data: Me | null) => {
        setMe(data?.user || null);
      })
      .catch(() => {
        setMe(null);
      });
  }, [pathname]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setMe(null);
    setShowDropdown(false);
    router.push('/');
  };

  const headerTone =
      mode === "waibi"
          ? "bg-black/60 text-white border-white/10"
          : "bg-white/80 text-black border-black/10";

  const buttonTone =
      mode === "waibi"
          ? "border-white/30 hover:border-white/60"
          : "border-black/30 hover:border-black/60";

  return (
      <header
          className={`sticky top-0 z-20 backdrop-blur border-b transition-colors ${headerTone}`}
          suppressHydrationWarning
      >
        {/* 第一行：中部导航（可伸缩） | 右侧用户 + 主题按钮（始终最右） */}
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-6 py-4 sm:px-8">
          {/* 中：桌面端导航，flex-1 让右侧能被推到最右 */}
          <nav className="hidden md:flex flex-1 items-center justify-center text-sm">
            <ul className="flex items-center gap-3">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`relative px-2 py-1 font-semibold transition-opacity ${
                        active ? (mode === "waibi" ? "text-white" : "text-gray-900") : "opacity-70 hover:opacity-100"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="pixel-text">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* 右：主题切换 + 用户信息（下拉菜单） */}
          <div className="ml-auto shrink-0 flex items-center gap-2">
            {/* 主题切换按钮 */}
            <button
              type="button"
              onClick={toggleMode}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80 ${
                mode === "waibi"
                  ? "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
              aria-label={mode === "waibi" ? "切换到理智模式" : "切换到歪比模式"}
              title={mode === "waibi" ? "切换到理智模式" : "切换到歪比模式"}
              suppressHydrationWarning
            >
              {mode === "waibi" ? (
                <MdDarkMode className="w-5 h-5" />
              ) : (
                <MdLightMode className="w-5 h-5" />
              )}
            </button>

            {me ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="用户菜单"
                >
                  <img
                    src={me.avatarUrl || "/favicon.ico"}
                    alt={me.username || me.name || "avatar"}
                    className="h-8 w-8 rounded-full object-cover border"
                  />
                  <span className="text-sm font-semibold hidden sm:inline">{me.username || me.name}</span>
                  <span className={`text-xs transition-transform ${showDropdown ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* 下拉菜单 */}
                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-50 ${
                    mode === "waibi"
                      ? "bg-black/90 border-white/20 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  }`}>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          router.push('/me');
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity ${
                          mode === "waibi" ? "hover:bg-white/10" : "hover:bg-gray-100"
                        }`}
                      >
                        个人主页
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          router.push('/me/instances');
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity ${
                          mode === "waibi" ? "hover:bg-white/10" : "hover:bg-gray-100"
                        }`}
                      >
                        模型实例管理
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          router.push('/me/training-samples');
                          setShowDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity ${
                          mode === "waibi" ? "hover:bg-white/10" : "hover:bg-gray-100"
                        }`}
                      >
                        训练集管理
                      </button>
                      <div className={`border-t my-1 ${
                        mode === "waibi" ? "border-white/20" : "border-gray-200"
                      }`} />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity ${
                          mode === "waibi" 
                            ? "hover:bg-red-500/20 text-red-400" 
                            : "hover:bg-red-50 text-red-600"
                        }`}
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={`text-sm font-semibold ${mode === "waibi" ? "text-gray-300" : "text-gray-700"}`}>
                登录
              </Link>
            )}
          </div>
        </div>

        {/* 二级 Header（仅移动端显示）：自动排列充满 + 小圆角 */}
        <div className={`sm:hidden border-t ${headerTone}`}>
          <ul className="mx-auto flex w-full max-w-[1200px] flex-wrap gap-2 px-6 py-3">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "block rounded-md border px-3 py-2 text-center text-xs font-semibold",
                      "pixel-text uppercase tracking-[0.08em]",
                      active
                        ? (mode === "waibi" ? "border-gray-600 text-white" : "border-gray-500 text-gray-900")
                        : `${buttonTone} opacity-90 hover:opacity-100`,
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </header>
  );
}
