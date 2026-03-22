import type { GetStaticProps } from "next";
import Link from "next/link";
import { Home } from "lucide-react";
import Header from "../components/Header";
import ProjectCard from "../components/ProjectCard";
import Seo from "../components/Seo";
import { getProjects, type Project } from "../lib/projects";

type ProjectsPageProps = {
    projects: Project[];
};

export default function ProjectsPage({ projects }: ProjectsPageProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Projects",
        url: "https://eottabom.github.io/projects/",
        description: "개인 프로젝트를 한 곳에 모아 정리한 페이지입니다.",
        mainEntity: {
            "@type": "ItemList",
            itemListElement: projects.map((project, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `https://eottabom.github.io/projects/${project.slug}/`,
                name: project.title,
            })),
        },
    };

    return (
        <>
            <Seo
                title="Projects"
                description="개인 프로젝트를 카드 형태로 모아두고, 각 프로젝트의 배경과 구현 내용을 정리한 페이지."
                jsonLd={jsonLd}
            />
            <div className="bg-white text-black">
                <Header />
                <div className="mx-auto w-full px-4 py-14 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Projects</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Side projects, experiments, and small products I wanted to build out for myself.
                    </p>
                </div>
            </div>

            <main className="mx-auto max-w-6xl px-6 pb-20">
                {projects.length === 0 ? (
                    <p className="text-zinc-500">아직 등록된 프로젝트가 없습니다.</p>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <ProjectCard key={project.slug} project={project} />
                        ))}
                    </div>
                )}
            </main>

            <Link
                href="/"
                className="fixed bottom-6 right-6 z-50 rounded-lg border border-gray-300 bg-white p-3 shadow-md transition hover:shadow-lg"
                aria-label="홈으로 가기"
            >
                <Home className="h-6 w-6 text-gray-800" />
            </Link>
        </>
    );
}

export const getStaticProps: GetStaticProps<ProjectsPageProps> = async () => {
    return {
        props: {
            projects: getProjects(),
        },
    };
};
