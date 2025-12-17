import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import React from "react";
import { UniverseToastContainer } from "@/components/universe-toast";
import { UniverseConfirmContainer } from "@/components/universe-confirm";

export const metadata: Metadata = {
    title: "Waibi 宇宙",
    description:
        "在 Waibi 宇宙里，你可以与一位神秘人的意识体交流。",
    metadataBase: new URL("https://waibi.physicistscard.com"),
    openGraph: {
        title: "Waibi Waibi | Waibi Babu",
        description:
            "在聊一聊里与我的意识体交流！",
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
        <head>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        (function() {
                            try {
                                const savedMode = localStorage.getItem('waibi-mode');
                                const mode = (savedMode === 'waibi' || savedMode === 'rational') ? savedMode : 'rational';
                                document.documentElement.setAttribute('data-mode', mode);
                                if (mode === 'waibi') {
                                    document.documentElement.classList.add('dark');
                                    document.documentElement.style.colorScheme = 'dark';
                                } else {
                                    document.documentElement.classList.remove('dark');
                                    document.documentElement.style.colorScheme = 'light';
                                }
                            } catch (e) {
                                document.documentElement.setAttribute('data-mode', 'rational');
                            }
                        })();
                    `,
                }}
            />
        </head>
        <body>
        <Providers initialMode="rational">
            {children}
            <UniverseToastContainer />
            <UniverseConfirmContainer />
        </Providers>
        </body>
        </html>
    );
}