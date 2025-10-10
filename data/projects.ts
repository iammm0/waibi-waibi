// data/projects.ts
import { formatDate, slugify } from "@/lib/waibi";

export type ProjectStatus = "alive" | "unstable" | "legend";

export interface ProjectEntry {
  slug: string;
  name: string;
  elevator: string;
  tech: string[];
  status: ProjectStatus;
  updatedAt: string; // YYYY-MM-DD
  story: string;
  readme: string[];
  links: Array<{ label: string; href: string }>;
}

/**
 * 固定置顶顺序：你提到的三个真实项目
 * 会强制排在最前（依次：PhysicistsCard → GrowForever → OnePenny），
 * 其它项目再按更新时间倒序。
 */
const PINNED_ORDER = ["PhysicistsCard", "GrowForever", "OnePenny"] as const;

/* -------------------------------------------------------------------------- */
/*                             你的真实项目清单                                 */
/* -------------------------------------------------------------------------- */

const baseProjects = [
  {
    name: "PhysicistsCard",
    elevator: "把物理学家的名言做成像素风卡片，可一键生成社交图与贴纸。",
    tech: ["Next.js", "TailwindCSS", "MDX", "OG Image", "Vercel Edge"],
    status: "alive",
    updatedAt: "2025-10-08",
    story:
        "剧情感宣言：当海森堡遇到像素雨，确定性只剩下一张卡片。把物理学家的名言、头像与生平片段做成可收藏/分享的卡牌宇宙。",
    readme: [
      "卡面由 MDX 驱动，支持主题与动态布局（像素风 / 网格风）。",
      "内置 OG Image 生成：分享即图，不靠截图。",
      "计划接 GitHub Issues 作“语录收集池”，自动生成 PR 填充卡片库。",
      "提供导出 PNG / WebP 按需放大，移动端长按直存。",
    ],
    links: [
      { label: "Demo（占位）", href: "https://example.com/physicists-card" },
      { label: "Repo（占位）", href: "https://github.com/yourname/PhysicistsCard" },
      { label: "设计记录（占位）", href: "https://example.com/notes/physicists-card" },
    ],
  },
  {
    name: "GrowForever",
    elevator: "自养型数字花园：内容像藤蔓一样互相长出关联与可视化。",
    tech: ["Next.js", "MDX", "Graph 可视化", "D3.js", "SQLite/Drizzle"],
    status: "unstable",
    updatedAt: "2025-09-22",
    story:
        "剧情感宣言：博客不是时间线，而是生态位。让文章彼此结种、发芽、缠绕，生成“阅读路线”和“灵感蔓延图”。",
    readme: [
      "MDX Frontmatter 建模“养分”（tags、mood、seed）以驱动推荐。",
      "用 D3.js 画出“灵感图谱”，点节点跳到相邻文章。",
      "计划引入“歪比指数”作为内容能量条，决定首页出现权重。",
      "离线优先（IndexedDB 缓存），弱网也能逛。",
    ],
    links: [
      { label: "Demo（占位）", href: "https://example.com/grow-forever" },
      { label: "Repo（占位）", href: "https://github.com/yourname/GrowForever" },
    ],
  },
  {
    name: "OnePenny",
    elevator: "一分钱实验：最小可行的支付闭环与 A/B 计费试验场。",
    tech: ["Next.js", "Stripe", "Cloudflare Workers", "Postgres/Prisma"],
    status: "legend",
    updatedAt: "2025-07-30",
    story:
        "剧情感宣言：如果价值只需一分钱证明，那我用最短链路把“点子→付款→回执”走完整。更多是对商业闭环的戏剧化演练。",
    readme: [
      "一键创建结算链接，回调落库并生成可验证的收据页。",
      "A/B 实验：定价与话术实时切换，埋点统计转化差异。",
      "Workers 充当签名/校验边缘层，降低延迟，提高容错。",
      "预留 Webhook 仿真：本地也能全链路跑通。",
    ],
    links: [
      { label: "Demo（占位）", href: "https://example.com/one-penny" },
      { label: "Repo（占位）", href: "https://github.com/yourname/OnePenny" },
      { label: "结算回执样例（占位）", href: "https://example.com/one-penny/receipt" },
    ],
  },
] as const satisfies Omit<ProjectEntry, "slug">[];

/* -------------------------------------------------------------------------- */

export const projectEntries: ProjectEntry[] = baseProjects.map((project) => ({
  ...project,
  slug: slugify(project.name),
}));

export function getProjectBySlug(slug: string) {
  return projectEntries.find((project) => project.slug === slug);
}

export function getProjectPreview() {
  return projectEntries
      .slice()
      .sort((a, b) => {
        // 置顶优先：PhysicistsCard → GrowForever → OnePenny
        const ai = PINNED_ORDER.indexOf(a.name as (typeof PINNED_ORDER)[number]);
        const bi = PINNED_ORDER.indexOf(b.name as (typeof PINNED_ORDER)[number]);
        const ap = ai === -1 ? Number.POSITIVE_INFINITY : ai;
        const bp = bi === -1 ? Number.POSITIVE_INFINITY : bi;
        if (ap !== bp) return ap - bp;

        // 其余按更新时间倒序
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .map((project) => ({
        ...project,
        formattedDate: formatDate(project.updatedAt),
      }));
}
