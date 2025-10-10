export interface WaibiQuote {
  text: string;
  mood: "prophecy" | "self-roast" | "tech";
  seed: string;
}

export const quotes: WaibiQuote[] = [
  {
    text: "我不在创造代码，我在召唤幻觉。",
    mood: "prophecy",
    seed: "classic-1",
  },
  {
    text: "需求是观测者，我只是量子波函数。",
    mood: "tech",
    seed: "classic-2",
  },
  {
    text: "重构不是清理，是驱鬼。",
    mood: "self-roast",
    seed: "classic-3",
  },
  {
    text: "性能优化成功了，风也更顺了。",
    mood: "tech",
    seed: "classic-4",
  },
  {
    text: "部署失败？那说明宇宙临时不同意。",
    mood: "self-roast",
    seed: "classic-5",
  },
  {
    text: "我把异常堆栈背成打油诗，只为调戏命运。",
    mood: "prophecy",
    seed: "extra-6",
  },
  {
    text: "Bug 不是敌人，是宇宙提醒我睡觉。",
    mood: "self-roast",
    seed: "extra-7",
  },
  {
    text: "逻辑图是显微镜，胡思乱想是望远镜。",
    mood: "prophecy",
    seed: "extra-8",
  },
  {
    text: "堆栈一折叠，命运就换行。",
    mood: "tech",
    seed: "extra-9",
  },
];

export function getRandomQuote(excludeSeed?: string): WaibiQuote {
  const pool = excludeSeed
    ? quotes.filter((q) => q.seed !== excludeSeed)
    : quotes;
  return pool[Math.floor(Math.random() * pool.length)];
}
