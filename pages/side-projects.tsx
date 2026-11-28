import type { GetStaticProps } from "next";
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
        name: "Side Projects",
        url: "https://eottabom.github.io/side-projects/",
        description: "개인 프로젝트를 한 곳에 모아 정리한 페이지입니다.",
        mainEntity: {
            "@type": "ItemList",
            itemListElement: projects.map((project, index) => ({
                "@type": "ListItem",
                position: index + 1,
                url: `https://eottabom.github.io/side-projects/${project.slug}/`,
                name: project.title,
            })),
        },
    };

    return (
        <>
            <Seo
                title="Side Projects"
                description="개인 프로젝트를 카드 형태로 모아두고, 각 프로젝트의 배경과 구현 내용을 정리한 페이지."
                jsonLd={jsonLd}
            />
            <Header />
            {/* 다른 목록 페이지(Posts, Knowledge)와 같은 히어로 */}
            <div className="bg-gradient-to-b from-sky-50 via-emerald-50/40 to-white text-gray-800">
                <div className="mx-auto w-full px-4 py-14 text-center sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Side Projects</h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Personal projects I built because I wanted to use them myself, taken from idea to release on my own.
                    </p>
                </div>
            </div>

            <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
                {projects.length === 0 ? (
                    <p className="text-zinc-500">아직 등록된 프로젝트가 없습니다.</p>
                ) : (
                    // 프로젝트 수가 적어서 2열로 넓게 보여준다.
                    <div className="grid gap-6 md:grid-cols-2">
                        {projects.map((project) => (
                            <ProjectCard key={project.slug} project={project} />
                        ))}
                    </div>
                )}
            </main>
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
