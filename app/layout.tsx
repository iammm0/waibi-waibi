import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import React from "react";

export const metadata: Metadata = {
    title: "Waibi Waibi — 半疯半神的宇宙废料场",
    description:
        "Waibi Waibi 是一个半疯半神的个人宇宙，荒诞与理性并存，记录项目、心流、实验与歪语录。",
    metadataBase: new URL("https://waibi-waibi.local"),
    openGraph: {
        title: "Waibi Waibi | Where chaos meets creation",
        description:
            "半疯半神的混沌日志，Mind Dump、Projects、Mirror Room 与 Chaos Playground 在此集合。",
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