import { formatDate, slugify } from "@/lib/waibi";

export type ProjectStatus = "alive" | "unstable" | "legend";

export interface ProjectEntry {
  slug: string;
  name: string;
  elevator: string;
  tech: string[];
  status: ProjectStatus;
  updatedAt: string;
  story: string;
  readme: string[];
  links: Array<{ label: string; href: string }>;
}

const baseProjects = [
  {
    name: "Chrono-Glitch HUD",
    elevator: "把正常流程拧到 37°歪。",
    tech: ["Next.js", "WebGL", "TypeScript"],
    status: "alive",
    updatedAt: "2024-12-05",
    story:
      "剧情感宣言：这是个故障感时间面板，用户在里面看到的不只是数据，还有“如果没有加班”版的时间线。",
    readme: [
      "核心是一个可拖动的时间轴，左边是真实记录，右边是我脑补的平行宇宙。",
      "使用 WebGL 渲染扫描线，同时保持 60fps —— 不然就不叫 HUD。",
      "GitHub 元数据接口预留，后续会自动展示 Star 趋势。",
    ],
    links: [{ label: "设计脑洞", href: "https://example.com/chrono-glitch" }],
  },
  {
    name: "Stacktrace Opera",
    elevator: "给异常堆栈一个舞台。",
    tech: ["Node.js", "Vite", "MDX"],
    status: "unstable",
    updatedAt: "2024-11-18",
    story: "剧情感宣言：每一次后端哭泣，都被翻译成朗诵版的错误报告。",
    readme: [
      "将错误堆栈按剧本格式排版，左右声道分别朗读调用栈和变量状态。",
      "可以导出为播客片段，用来教育未来的自己。",
      "预留远端语音合成接口，待宇宙批准。",
    ],
    links: [
      { label: "原型截图", href: "https://example.com/stacktrace-opera" },
    ],
  },
  {
    name: "Entropy Atlas",
    elevator: "在部署面前练级的勇者地图。",
    tech: ["Astro", "D3.js", "Cloudflare"],
    status: "legend",
    updatedAt: "2024-08-01",
    story: "剧情感宣言：把历史上失败的上线画成星座，方便在下次发布前占卜。",
    readme: [
      "读取 CI/CD 日志，自动生成失败星座图。",
      "每个节点都能展开，展示当时的 commit、负责人和最后的自嘲语录。",
      "有个隐藏开关，按下去可以切换到“理智视图”，只看 KPI。",
    ],
    links: [{ label: "星座展示", href: "https://example.com/entropy-atlas" }],
  },
] as const satisfies Omit<ProjectEntry, "slug">[];

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
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .map((project) => ({
      ...project,
      formattedDate: formatDate(project.updatedAt),
    }));
}
