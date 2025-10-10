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
    title: "今天我把 Bug 养成了宠物",
    date: "2024-12-09",
    tags: ["debug", "frontend", "self-roast"],
    summary: "给一个刁钻的 race condition 喂食，直到它愿意被收编。",
    content: [
      {
        type: "paragraph",
        value:
          "深夜 2:37，我把浏览器的 Performance 面板当作菜市场，挑拣一条条异步调用的鱼骨。结果发现 Bug 只是想要定时器多一毫秒的关怀。",
      },
      {
        type: "list",
        value: [
          "把 Promise 链当作地图，而不是套娃。",
          "给 requestIdleCallback 开了心率监测。",
          "在日志里夹带一段小诗，让未来的我记得回家。",
        ],
      },
      {
        type: "code",
        value: `setInterval(() => {\n  petBug.mood === 'stable' ? petBug.purr() : petBug.glitch();\n}, 42);`,
      },
    ],
    seed: "bug-pet",
  },
  {
    title: "这段代码不是写的，是降临的",
    date: "2024-11-21",
    tags: ["design systems", "pixels", "glitch"],
    summary: "Figma 崩溃三次后，我干脆让终端来设计配色。",
    content: [
      {
        type: "paragraph",
        value:
          "灵感像传送门，总是开在不合时宜的时候。于是我写了一个脚本，让噪点和 chromatic aberration 自己长出来。",
      },
      {
        type: "paragraph",
        value:
          "终端吐出的随机数像预言：\n 0.618 -> 主色调；\n 3.1415 -> 间距；\n 42 -> 动画间隔。听起来像疯话，但页面最后竟然稳得离谱。",
      },
    ],
    seed: "code-descend",
  },
  {
    title: "凌晨三点的日志长这样",
    date: "2024-10-02",
    tags: ["observability", "infra"],
    summary: "把日志管道改造成诗句输送机，让异常堆栈可以押韵。",
    content: [
      {
        type: "paragraph",
        value:
          "Elasticsearch 像一个偏执的图书管理员。我给它安了情绪识别，在异常等级高的时候自动生成一段“请深呼吸”的提示。",
      },
      {
        type: "list",
        value: [
          "日志 -> Kafka -> 净化机 (把脏话替换成象形文字)",
          "净化机 -> GPT -> 技术复盘草稿",
          "复盘草稿 -> 团队晨会 -> 今天的荒诞新闻",
        ],
      },
    ],
    seed: "logs-poem",
  },
  {
    title: "缓存像猫，需要被顺毛",
    date: "2024-09-12",
    tags: ["performance", "backend"],
    summary: "Redis 抽风后，我给它配了个香薰灯（慢查询报警）。",
    content: [
      {
        type: "paragraph",
        value:
          "缓存命中率掉到 78%，系统像在发低烧。于是我写了个小仪表盘，把失效 keys 按温度排序，热的放左边，冷的放右边。",
      },
      {
        type: "paragraph",
        value: "事实证明，只要给缓存打上“摸鱼标签”，开发者们的关注度立刻飙升。",
      },
    ],
    seed: "cache-cat",
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
