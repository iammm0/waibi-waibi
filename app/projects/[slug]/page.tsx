import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SectionHeader from "@/components/section-header";
import { getProjectBySlug } from "@/data/projects";
import { formatDate } from "@/lib/waibi";

interface ProjectDetailProps {
  params: { slug: string };
}

const statusNarration = {
  alive: "仍在呼吸的项目，欢迎喂 bug。",
  unstable: "半废半活，偶尔抽风，请自备安全绳。",
  legend: "已成传说，但源码仍在星空里漂浮。",
};

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const project = getProjectBySlug(params.slug);
  if (!project) {
    notFound();
  }
  const formattedDate = formatDate(project.updatedAt);

  return (
    <article className="space-y-10">
      <SectionHeader
        title={project.name}
        subtitle={`${project.elevator} · 最近更新：${formattedDate}`}
        actions={
          <span className="badge">{statusNarration[project.status]}</span>
        }
      />
      <section className="card-base space-y-4">
        <h2 className="pixel-text text-lg uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
          剧情感宣言
        </h2>
        <p className="text-base leading-relaxed opacity-90">{project.story}</p>
      </section>
      <section className="card-base space-y-4">
        <h2 className="pixel-text text-lg uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
          理性 README
        </h2>
        <ul className="space-y-3 text-sm leading-relaxed">
          {project.readme.map((item) => (
            <li
              key={item}
              className="border-l-2 border-[var(--accent-cyan)]/50 pl-3"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="card-base space-y-4">
        <h2 className="pixel-text text-lg uppercase tracking-[0.3em] text-[var(--accent-cyan)]">
          技术情绪板
        </h2>
        <div className="flex flex-wrap gap-2 text-xs">
          {project.tech.map((tech) => (
            <span key={tech} className="badge opacity-80">
              {tech}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {project.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              className="underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
      <aside className="card-base text-sm opacity-80">
        后续计划：接入 GitHub API 自动抓取 star 数和最新 commit。该接口预留在
        data/projects.ts 中，欢迎连接真实数据源。
      </aside>
    </article>
  );
}

export function generateMetadata({ params }: ProjectDetailProps): Metadata {
  const project = getProjectBySlug(params.slug);
  if (!project) {
    return {
      title: "Projects",
    };
  }
  return {
    title: `${project.name} | Projects`,
    description: project.story,
  };
}
