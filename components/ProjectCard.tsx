import Link from "next/link";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import type { Project, ProjectStatus } from "../lib/projects";

const statusLabel: Record<ProjectStatus, string> = {
    active: "Active",
    archived: "Archived",
    wip: "WIP",
};

const statusClassName: Record<ProjectStatus, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    archived: "bg-gray-100 text-gray-600 ring-gray-200",
    wip: "bg-amber-50 text-amber-700 ring-amber-200",
};

// 목록 카드와 상세 페이지가 같이 쓰는 상태 배지
export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
    return (
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusClassName[status]}`}>
            {statusLabel[status]}
        </span>
    );
}

// 기술 스택 꼬리표. 버튼(둥근 알약, 테두리)과 헷갈리지 않도록 테두리 없는 연회색 사각 라벨로 둔다.
export function TechChip({ children }: { children: string }) {
    return <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{children}</span>;
}


// 카드 전체를 링크로 감싸면 안쪽의 GitHub, Demo 를 진짜 외부 링크로 만들 수 없다(링크 안에 링크를 넣을 수 없음).
// 그래서 썸네일과 제목은 상세 페이지 링크로, 아래 줄은 상세 링크와 외부 링크를 나란히 둔다.
export default function ProjectCard({ project }: { project: Project }) {
    const href = `/side-projects/${project.slug}/`;
    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
            <Link href={href} className="block" tabIndex={-1} aria-hidden>
                <div className="aspect-[16/10] overflow-hidden border-b border-gray-100 bg-gray-50">
                    {project.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={project.thumbnail}
                            alt=""
                            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm font-medium text-gray-400">{project.title}</div>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                        <Link href={href} className="hover:text-blue-600">
                            {project.title}
                        </Link>
                    </h2>
                    <ProjectStatusBadge status={project.status} />
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{project.summary}</p>

                <div className="mb-6 mt-4 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                        <TechChip key={tag}>{tag}</TechChip>
                    ))}
                </div>

                {/* 꼬리표와 섞이지 않도록 구분선 아래 줄에 링크만 둔다. 상세로 가는 주 링크는 왼쪽, 외부 링크는 오른쪽 */}
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-blue-600">
                        View Project
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                    <div className="flex items-center gap-4">
                        {project.github && (
                            <a
                                href={project.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                            >
                                <Github className="h-4 w-4" aria-hidden />
                                GitHub
                            </a>
                        )}
                        {project.demo && (
                            <a
                                href={project.demo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
                            >
                                Demo
                                <ArrowUpRight className="h-4 w-4" aria-hidden />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
