import Link from "next/link";
import ChaosCanvas from "@/components/chaos-canvas";
import EntryHero from "@/components/entry-hero";
import MindDumpCard from "@/components/mind-dump-card";
import ProjectCard from "@/components/project-card";
import SectionHeader from "@/components/section-header";
import { getMindDumpPreview } from "@/data/mind-dump";
import { getProjectPreview } from "@/data/projects";

export default function HomePage() {
  const mindPreviews = getMindDumpPreview().slice(0, 3);
  const projectPreviews = getProjectPreview().slice(0, 3);

  return (
    <div className="space-y-16">
      <EntryHero />

      <section>
        <SectionHeader
          title="Mind Dump"
          subtitle="精神溢出区：临时把脑内缓存导出，字句半真半假，但记忆是真的。"
          actions={
            <Link href="/mind-dump" className="badge glitch-hover">
              查看全部
            </Link>
          }
        />
        <div className="section-grid">
          {mindPreviews.map((entry) => (
            <MindDumpCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Projects"
          subtitle="狠活展示区：给异常堆栈一个舞台，顺便记下我和宇宙谈判的结果。"
          actions={
            <Link href="/projects" className="badge glitch-hover">
              查看全部
            </Link>
          }
        />
        <div className="section-grid">
          {projectPreviews.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Chaos Playground"
          subtitle="炫技实验室：短促但惊艳的故障光束，有降噪按钮，放心。"
          actions={
            <Link href="/chaos-playground" className="badge glitch-hover">
              进入实验室
            </Link>
          }
        />
        <ChaosCanvas reduced />
        <p className="text-sm opacity-70">
          这是缩略版实验，完整版会根据模式强度释放更多电流。移动端自动降级，避免把地铁上的你吓到。
        </p>
      </section>
    </div>
  );
}
