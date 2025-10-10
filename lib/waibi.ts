export type WaibiIndexSeed = string | number;

export function computeWaibiIndex(seed: WaibiIndexSeed, text: string): number {
  const combined = `${seed}-${text.length}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i += 1) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0; // convert to 32bit integer
  }
  const normalized = Math.abs(hash % 101);
  return normalized;
}

export function formatDate(date: string | Date): string {
  const target = typeof date === "string" ? new Date(date) : date;
  return target.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
