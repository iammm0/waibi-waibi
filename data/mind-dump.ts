import { computeWaibiIndex, formatDate, slugify } from "@/lib/waibi";

export interface MindDumpEntry {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  content: Array<{
    type: "paragraph" | "list" | "code";
    value: string | string[];
  }>;
  seed: string;
}

const baseEntries = [
  {
    title: "PhysicistsCard：我在像素里复活薛定谔",
    date: "2025-08-28",
    tags: ["nextjs", "design", "physicistscard"],
    summary: "像素有生命，名言有电流。",
    content: [
      {
        type: "paragraph",
        value:
            "当我给卡面加上发光的边框，薛定谔在控制台里警告：'Your component re-rendered twice.'",
      },
      {
        type: "list",
        value: [
          "每一张卡都绑定一个量子态（hover => collapse）。",
          "字体加载延迟的那一刻，我看到宇宙闪烁了 0.3 秒。",
          "后来我发现，按 F12 可以观察波函数坍缩。",
        ],
      },
      {
        type: "code",
        value: `function SuperpositionCard() {\n  return hovered ? "猫活着" : "猫死了";\n}`,
      },
    ],
    seed: "physicists-respawn",
  },
  {
    title: "OnePenny：一分钱买到一场哲学实验",
    date: "2025-07-21",
    tags: ["stripe", "webhooks", "business", "chaos"],
    summary: "支付系统通了，理智账户透支了。",
    content: [
      {
        type: "paragraph",
        value:
            "我用 Stripe 创建了一个 0.01 元结算链路。每次有人支付，我都会收到一个 POST 请求，然后陷入反思：我是不是在出售注意力本身？",
      },
      {
        type: "list",
        value: [
          "Webhook 回调有 200ms 延迟，像宇宙在思考。",
          "成功页面的 confetti 动画比交易还贵。",
          "后来我把所有金额都改成 π 元，看起来更有仪式感。",
        ],
      },
    ],
    seed: "penny-ritual",
  },
] as const satisfies Omit<MindDumpEntry, "slug">[];

export const mindDumpEntries: MindDumpEntry[] = baseEntries.map((entry) => ({
  ...entry,
  slug: slugify(entry.title),
}));

export function getMindDumpBySlug(slug: string): MindDumpEntry | undefined {
  return mindDumpEntries.find((entry) => entry.slug === slug);
}

export function getMindDumpPreview() {
  return mindDumpEntries
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((entry) => ({
        ...entry,
        formattedDate: formatDate(entry.date),
        waibiIndex: computeWaibiIndex(entry.seed, entry.summary),
      }));
}
