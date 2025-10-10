"use client";

import { useMemo, useState } from "react";
import ProjectCard from "@/components/project-card";
import SectionHeader from "@/components/section-header";
import { getProjectPreview, type ProjectStatus } from "@/data/projects";

const previews = getProjectPreview();

export default function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatus | "all">("all");

  const filtered = useMemo(() => {
    if (status === "all") return previews;
    return previews.filter((project) => project.status === status);
  }, [status]);

  return (
    <div>
      <SectionHeader
        title="Projects"
        subtitle="狠活展示区。每个项目都配有剧情宣言与理性 README，方便你决定信还是不信。"
        actions={
          <div className="flex items-center gap-2 text-xs">
            {["all", "alive", "unstable", "legend"].map((item) => (
              <button
                key={item}
                type="button"
                className={`badge glitch-hover ${status === item ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)]" : "opacity-70"}`}
                onClick={() => setStatus(item as ProjectStatus | "all")}
              >
                {item === "all" ? "全部" : item}
              </button>
            ))}
          </div>
        }
      />
      <div className="section-grid">
        {filtered.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
