import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { cookies } from "next/headers";

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

export default async function RootLayout({
                                             children,
                                         }: Readonly<{ children: React.ReactNode }>) {
    const cs = await cookies();
    const cookieMode = cs.get("waibi-mode")?.value === "waibi" ? "waibi" : "rational";
    const cookieMotion = cs.get("waibi-motion")?.value === "calm" ? "calm" : "wild";

    return (
        <html lang="zh-CN" suppressHydrationWarning data-mode={cookieMode} data-motion={cookieMotion}>
        {/* 使用本地字体变量 */}
        <body className="font-sans" style={{ fontFamily: "var(--pixel-font), sans-serif" }}>
        <Providers initialMode={cookieMode} initialMotion={cookieMotion}>
            {children}
        </Providers>
        </body>
        </html>
    );
}
