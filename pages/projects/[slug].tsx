import type { GetStaticPaths, GetStaticProps } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Github, List } from "lucide-react";
import Header from "../../components/Header";
import Seo from "../../components/Seo";
import { getProjectBySlug, getProjectSlugs, type Project } from "../../lib/projects";

const statusLabel = {
    active: "Active",
    archived: "Archived",
    wip: "WIP",
} as const;

type ProjectDetailProps = {
    project: Project;
};

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <div className="mt-3 leading-7 text-gray-700">{children}</div>
        </section>
    );
}

export default function ProjectDetailPage({ project }: ProjectDetailProps) {
    const canonical = `https://eottabom.github.io/projects/${project.slug}/`;
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title,
        description: project.description,
        url: canonical,
        dateCreated: project.date,
        keywords: project.tags,
    };

    return (
        <>
            <Header />
            <Seo
                title={project.title}
                description={project.description}
                ogType="article"
                publishedTime={project.date}
                ogImage={project.thumbnail}
                tags={project.tags}
                jsonLd={jsonLd}
            />

            <main className="mx-auto max-w-5xl px-6 py-16">
                <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-br from-slate-950 via-slate-800 to-blue-600 px-8 py-12 text-white">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                            <span>{project.date}</span>
                            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">
                                {statusLabel[project.status]}
                            </span>
                        </div>
                        <h1 className="mt-4 text-4xl font-bold tracking-tight">{project.title}</h1>
                        <p className="mt-4 max-w-3xl text-base leading-7 text-white/85">{project.description}</p>

                        {project.aiAssisted && (
                            <p className="mt-3 text-sm text-white/50">
                                Some parts of this project were developed with the assistance of AI tools.
                            </p>
                        )}

                        <div className="mt-6 flex flex-wrap gap-2">
                            {project.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium text-white"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {project.github && (
                                <a
                                    href={project.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                                >
                                    <Github className="h-4 w-4" />
                                    View GitHub
                                </a>
                            )}
                            {project.demo && (
                                <a
                                    href={project.demo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    <ArrowUpRight className="h-4 w-4" />
                                    Live Demo
                                </a>
                            )}
                        </div>
                    </div>

                    {project.thumbnail && (
                        <div className="border-b border-gray-200 bg-gray-50 p-8">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={project.thumbnail}
                                alt={project.title}
                                className="w-full rounded-2xl object-cover shadow-sm"
                                loading="lazy"
                            />
                        </div>
                    )}

                    <div className="grid gap-6 p-8">
                        <DetailSection title="Summary">
                            <p>{project.summary}</p>
                        </DetailSection>

                        {project.problem && (
                            <DetailSection title="Why I Built It">
                                <p>{project.problem}</p>
                            </DetailSection>
                        )}

                        {project.approach && (
                            <DetailSection title="Approach">
                                <p>{project.approach}</p>
                            </DetailSection>
                        )}

                        {project.features.length > 0 && (
                            <DetailSection title="Key Features">
                                <ul className="list-disc space-y-2 pl-5">
                                    {project.features.map((feature) => (
                                        <li key={feature}>{feature}</li>
                                    ))}
                                </ul>
                            </DetailSection>
                        )}

                        {project.role && (
                            <DetailSection title="My Role">
                                <p>{project.role}</p>
                            </DetailSection>
                        )}

                        {project.techStack && project.techStack.length > 0 && (
                            <DetailSection title="Tech Stack">
                                <div className="flex flex-wrap gap-2">
                                    {project.techStack.map((tech) => (
                                        <span
                                            key={tech}
                                            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                                        >
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </DetailSection>
                        )}

                        {project.whatILearned && (
                            <DetailSection title="What I Learned">
                                <p>{project.whatILearned}</p>
                            </DetailSection>
                        )}

                    </div>
                </div>
            </main>

            <Link
                href="/projects"
                className="fixed bottom-6 right-6 z-50 rounded-lg border border-gray-300 bg-white p-3 shadow-md transition hover:shadow-lg"
                aria-label="프로젝트 목록으로 가기"
            >
                <List className="h-6 w-6 text-gray-800" />
            </Link>
        </>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: getProjectSlugs().map((slug) => ({ params: { slug } })),
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps<ProjectDetailProps> = async ({ params }) => {
    const slug = params?.slug as string;
    return {
        props: {
            project: getProjectBySlug(slug),
        },
    };
};
