import Link from "next/link";
import type { ProjectEntry } from "@/data/projects";

interface ProjectPreview extends ProjectEntry {
  formattedDate: string;
}

const statusLabel: Record<ProjectEntry["status"], string> = {
  alive: "活",
  unstable: "半废",
  legend: "已成传说",
};

const statusClass: Record<ProjectEntry["status"], string> = {
  alive: "status-alive",
  unstable: "status-unstable",
  legend: "status-legend",
};

export default function ProjectCard({ project }: { project: ProjectPreview }) {
  return (
    <article className="card-base flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">
            <Link href={`/projects/${project.slug}`} className="glitch-hover">
              {project.name}
            </Link>
          </h2>
          <p className="mt-1 text-sm opacity-80">{project.elevator}</p>
        </div>
        <span className={`badge ${statusClass[project.status]}`}>
          {statusLabel[project.status]}
        </span>
      </header>
      <p className="text-xs uppercase tracking-[0.3em] opacity-60 pixel-text">
        {project.formattedDate}
      </p>
      <div className="flex flex-wrap gap-2 text-[0.7rem]">
        {project.tech.map((tech) => (
          <span key={tech} className="badge opacity-70">
            {tech}
          </span>
        ))}
      </div>
      <div className="mt-auto">
        <Link href={`/projects/${project.slug}`} className="badge glitch-hover">
          查看理性解释
        </Link>
      </div>
    </article>
  );
}
