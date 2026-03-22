import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import type { Project } from "../lib/projects";

const statusMap = {
    active: "Active",
    archived: "Archived",
    wip: "WIP",
} as const;

const statusClassName = {
    active: "bg-emerald-100 text-emerald-700",
    archived: "bg-zinc-200 text-zinc-700",
    wip: "bg-amber-100 text-amber-700",
} as const;

export default function ProjectCard({ project }: { project: Project }) {
    return (
        <article className="group h-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <Link href={`/projects/${project.slug}`} className="block h-full">
                <div className="flex h-full flex-col">
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-700 to-blue-500">
                        {project.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={project.thumbnail}
                                alt={project.title}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                        ) : (
                            <div className="flex h-full items-end p-6">
                                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">
                                    Personal Project
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
                                <p className="mt-1 text-sm text-gray-500">{project.summary}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[project.status]}`}>
                                {statusMap[project.status]}
                            </span>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
                            {project.description}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-gray-700">
                            {project.github && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Github className="h-4 w-4" />
                                    GitHub
                                </span>
                            )}
                            {project.demo && (
                                <span className="inline-flex items-center gap-1.5">
                                    <ArrowUpRight className="h-4 w-4" />
                                    Demo
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}
