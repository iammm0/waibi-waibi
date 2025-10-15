"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ============ 通用 Scramble 文本渲染（EntryHero 同款） ============ */
function scrambleText(target: string, progress: number, glyphs = "█▚▞▛ΔΩ✶☄") {
    return target
        .split("")
        .map((char, i) => {
            if (char === "\n" || char === " ") return char;
            if (i / target.length < progress) return char;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
        })
        .join("");
}

function ScrambleText({
                          text,
                          duration = 800,
                          step = 60,
                          className = "",
                      }: {
    text: string;
    duration?: number;
    step?: number;
    className?: string;
}) {
    const [mounted, setMounted] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => setMounted(true), []);
    useEffect(() => {
        if (!mounted) return;
        setProgress(0);
        const tick = window.setInterval(() => {
            setProgress((p) => Math.min(1, p + step / duration));
        }, step);
        const killer = window.setTimeout(() => {
            setProgress(1);
            window.clearInterval(tick);
        }, duration + 30);
        return () => {
            window.clearInterval(tick);
            window.clearTimeout(killer);
        };
    }, [mounted, text, duration, step]);

    const display = useMemo(
        () => (mounted ? scrambleText(text, progress) : text),
        [mounted, text, progress],
    );

    return (
        <span className={className} suppressHydrationWarning>
      {display}
    </span>
    );
}

/* ============ 结构化渲染：像 EntryHero 的“Hero 卡” ============ */
type StructuredReply = {
    title?: string;       // 大标题
    subtitle?: string;    // 副标题
    bullets?: string[];   // 项目符号
    links?: Array<{ label: string; href: string }>;
    mood?: string;        // 心情/标签
};

function parseReply(raw: string): StructuredReply | null {
    // 尝试解析 JSON；不是 JSON 就返回 null
    try {
        const obj = JSON.parse(raw);
        if (typeof obj === "object" && obj) return obj as StructuredReply;
    } catch (_) {}
    return null;
}

function HeroReply({ data }: { data: StructuredReply }) {
    const { title, subtitle, bullets, links, mood } = data;
    return (
        <section className="entry-hero rounded-3xl p-6 sm:p-8 border border-current/15 bg-[color:color-mix(in_srgb,transparent_85%,currentColor_5%)] shadow-[0_0_30px_rgba(21,243,255,0.12)] transition-colors">
            <div className="flex flex-col gap-4 items-center text-center max-w-3xl mx-auto">
                {mood && (
                    <span className="badge opacity-70 pixel-text">{mood}</span>
                )}
                {title && (
                    <h3 className="text-3xl sm:text-4xl font-extrabold">
                        <ScrambleText text={title} duration={900} />
                    </h3>
                )}
                {subtitle && (
                    <p className="text-sm sm:text-base opacity-90">
                        <ScrambleText text={subtitle} duration={700} />
                    </p>
                )}
                {!!bullets?.length && (
                    <ul className="grid sm:grid-cols-2 gap-2 text-left w-full mt-2">
                        {bullets.map((b, i) => (
                            <li
                                key={i}
                                className="card-base px-3 py-2 text-sm border border-current/15"
                            >
                                <ScrambleText text={b} duration={650 + i * 120} />
                            </li>
                        ))}
                    </ul>
                )}
                {!!links?.length && (
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-3">
                        {links.map((l, i) => (
                            <a
                                key={i}
                                href={l.href}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-4"
                            >
                                <ScrambleText text={l.label} duration={600 + i * 90} />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

/* ============ 聊天组件 ============ */
type Msg = { role: "user" | "assistant" | "system"; content: string };

export default function ChatWidget() {
    const [messages, setMessages] = useState<Msg[]>([
        { role: "system", content: "你已连接到 Waibi 的模型中转。可以返回纯文本，或返回 JSON：{title, subtitle, bullets, links}。" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function sendMessage(e?: React.FormEvent) {
        e?.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        setError(null);
        setLoading(true);
        const next = [...messages, { role: "user", content: text } as Msg];
        setMessages(next);
        setInput("");

        try {
            const res = await fetch("/api/llm", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ messages: next.filter((m) => m.role !== "system") }),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || `HTTP ${res.status}`);
            }

            const data = (await res.json()) as { reply: string };
            setMessages([...next, { role: "assistant", content: data.reply }]);
        } catch (err: any) {
            setError(err?.message || "请求失败");
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="space-y-4">
            {/* 历史消息列表（保留） */}
            <div className="card-base max-h-[420px] overflow-y-auto space-y-3 pr-1">
                {messages
                    .filter((m) => m.role !== "system")
                    .map((m, i) => (
                        <div
                            key={i}
                            className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                                m.role === "user"
                                    ? "bg-[color:color-mix(in_srgb,currentColor_10%,transparent)]"
                                    : "bg-[color:color-mix(in_srgb,currentColor_6%,transparent)]"
                            }`}
                        >
                            <div
                                className={`opacity-70 text-[0.75rem] mb-1 ${
                                    m.role === "user"
                                        ? "text-[var(--accent-cyan)]"
                                        : "text-[var(--accent-purple)]"
                                }`}
                            >
                                {m.role === "user" ? "你" : "赵明俊"}
                            </div>
                            <div className="whitespace-pre-wrap">{m.content}</div>
                        </div>
                    ))}
                {loading && (
                    <div className="rounded-lg px-3 py-2 text-sm opacity-70">
                        赵明俊正在考虑怎么好好说话……
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* 最新一条 assistant 用 EntryHero 风格渲染 */}
            {(() => {
                const last = [...messages].reverse().find((m) => m.role === "assistant");
                if (!last) return null;

                const structured = parseReply(last.content);
                if (structured) {
                    return <HeroReply data={structured} />;
                }
                return (
                    <section className="entry-hero rounded-3xl p-6 sm:p-8 border border-current/15 bg-[color:color-mix(in_srgb,transparent_85%,currentColor_5%)] shadow-[0_0_30px_rgba(21,243,255,0.12)]">
                        <div className="flex flex-col gap-4 items-center text-center max-w-3xl mx-auto">
                            <h3 className="text-2xl sm:text-3xl font-extrabold">
                                <ScrambleText text={last.content} duration={900} />
                            </h3>
                        </div>
                    </section>
                );
            })()}

            {error && (
                <div className="text-xs text-red-400 border border-red-400/40 rounded-md p-2">
                    {error}
                </div>
            )}

            {/* 输入区 */}
            <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                    className="flex-1 rounded-md bg-transparent px-3 py-2 text-sm
                    text-[var(--fg-waibi)] border border-[var(--accent-cyan)]
             shadow-[0_0_10px_hsl(var(--accent-cyan)/0.35)] transition-all duration-300
             [data-mode='rational']:bg-[var(--bg-rational)] [data-mode='rational']:text-[var(--fg-rational)]
                    "
                    placeholder='有什么想跟赵明俊的聊的吗？'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="
                    relative px-5 py-2 rounded-md text-sm font-semibold
      bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-purple)] to-[var(--accent-green)]
      hover:brightness-110 disabled:opacity-50 transition-all duration-300
      shadow-[0_0_10px_hsl(var(--accent-cyan)/0.55)] before:absolute before:inset-0 before:rounded-md
      before:border before:border-[var(--accent-cyan)]/60 before:animate-pulse
      dark:bg-gradient-to-r dark:from-[var(--accent-purple)] dark:via-[var(--accent-cyan)] dark:to-[var(--accent-green)]
                    "
                    aria-disabled={loading || !input.trim()}
                >
                    发送
                </button>
            </form>
        </section>
    );
}
