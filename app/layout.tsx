import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import React from "react";

export const metadata: Metadata = {
    title: "Waibi 宇宙",
    description:
        "在 Waibi 宇宙里，你可以与赵明俊的意识体交流。",
    metadataBase: new URL("https://waibi.physicistscard.com"),
    openGraph: {
        title: "Waibi Waibi | Waibi Babu",
        description:
            "在留言板里查看我的 Waibi 语录，在聊一聊里与我的意识体交流！",
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    // ✅ 不再使用 cookies()，直接传默认值
    return (
        <html lang="zh-CN" suppressHydrationWarning data-mode="rational" data-motion="wild">
        <body className="font-sans" style={{ fontFamily: "var(--pixel-font), sans-serif" }}>
        <Providers initialMode="rational" initialMotion="wild">
            {children}
        </Providers>
        </body>
        </html>
    );
}