import type { MirrorPrompt } from "@/data/mirror-room";

export default function MirrorPanel({ prompt }: { prompt: MirrorPrompt }) {
  return (
    <article className="card-base grid gap-4 md:grid-cols-2 md:items-start">
      <div className="flex flex-col gap-3 border-r border-white/10 pr-4 text-left md:border-white/10 md:pr-6">
        <h2 className="pixel-text text-lg uppercase tracking-[0.2em]">
          {prompt.prompt}
        </h2>
        <p className="text-sm leading-relaxed opacity-80">{prompt.response}</p>
      </div>
      <div className="relative flex flex-col gap-3 pl-4 text-right md:pl-6">
        <div
          className="absolute inset-0 -scale-x-100 opacity-10 blur-sm"
          aria-hidden
        >
          <p className="pixel-text text-lg uppercase tracking-[0.2em]">
            {prompt.prompt}
          </p>
        </div>
        <p className="text-sm leading-relaxed">{prompt.reflection}</p>
      </div>
    </article>
  );
}
