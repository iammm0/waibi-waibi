import type { Metadata } from "next";
import { Noto_Sans_SC, Press_Start_2P as PressStart2P } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const pixel = PressStart2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const noto = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-sans-cn",
  display: "swap",
});

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${pixel.variable} ${noto.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
