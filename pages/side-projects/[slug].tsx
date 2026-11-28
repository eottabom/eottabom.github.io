import type { GetStaticPaths, GetStaticProps } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
    AppWindow,
    ArrowLeft,
    ArrowUpDown,
    ArrowUpRight,
    Boxes,
    Cable,
    Code2,
    Container,
    Cpu,
    Github,
    Globe,
    Layers,
    LayoutList,
    ListTree,
    Monitor,
    Network,
    PanelLeft,
    Search,
    Server,
    Terminal,
    Workflow,
    type LucideIcon,
} from "lucide-react";
import Header from "../../components/Header";
import Seo from "../../components/Seo";
import { ProjectStatusBadge, TechChip } from "../../components/ProjectCard";
import ScreenshotCarousel from "../../components/ScreenshotCarousel";
import { getProjectBySlug, getProjectSlugs, type ArchitectureStep, type Project, type ProjectArchitecture } from "../../lib/projects";

type ProjectDetailProps = {
    project: Project;
};

// 데이터의 아이콘 이름과 실제 아이콘. 표에 없는 이름이면 아이콘 없이 그린다.
const ARCHITECTURE_ICONS: Record<string, LucideIcon> = {
    globe: Globe,
    monitor: Monitor,
    window: AppWindow,
    server: Server,
    layers: Layers,
    workflow: Workflow,
    terminal: Terminal,
    panel: PanelLeft,
    list: LayoutList,
    network: Network,
    tree: ListTree,
    code: Code2,
    search: Search,
    boxes: Boxes,
    gateway: Cable,
    container: Container,
    cpu: Cpu,
};

// 층마다 다른 색을 써서 위아래 층이 한눈에 구분되게 한다. Tailwind 가 찾을 수 있도록 클래스를 그대로 적는다.
const LAYER_COLORS = [
    { box: "border-sky-200 bg-sky-50/70", dot: "bg-sky-500", label: "text-sky-800", icon: "bg-sky-100 text-sky-700" },
    { box: "border-emerald-200 bg-emerald-50/70", dot: "bg-emerald-500", label: "text-emerald-800", icon: "bg-emerald-100 text-emerald-700" },
    { box: "border-amber-200 bg-amber-50/70", dot: "bg-amber-500", label: "text-amber-800", icon: "bg-amber-100 text-amber-700" },
];

// 넓은 화면에서 층 안의 구성 요소를 한 줄에 몇 개 놓을지. 본문 폭이 좁아서 4개는 4열 대신 2열 2줄로 둔다.
const NODE_COLUMNS: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-2",
};

// "핵심어: 설명" 으로 적은 항목을 굵은 핵심어와 설명 두 줄로 나눈다. 콜론이 없으면 한 덩어리로 둔다.
const splitKeyed = (text: string): { head: string | null; body: string } => {
    const index = text.indexOf(": ");
    if (index <= 0 || index > 40) {
        return { head: null, body: text };
    }
    return { head: text.slice(0, index), body: text.slice(index + 2) };
};

// 섹션 제목은 항목 제목보다 확실히 크게 둬서, 어디서 새 섹션이 시작하는지 바로 보이게 한다.
function SectionTitle({ title }: { title: string }) {
    return <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">{title}</h2>;
}

// 지식 그래프 상세 패널처럼 구분선으로 나눈 목록. 각 항목은 굵은 핵심어 아래에 설명을 둔다.
function DetailSection({ title, content }: { title: string; content: string | string[] }) {
    if (!Array.isArray(content)) {
        return (
            <section>
                <SectionTitle title={title} />
                <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{content}</p>
            </section>
        );
    }
    return (
        <section>
            <SectionTitle title={title} />
            <ul className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
                {content.map((item) => {
                    const { head, body } = splitKeyed(item);
                    return (
                        <li key={item} className="py-4">
                            {/* 제목은 크고 진하게, 설명은 작고 연하게 해서 두 줄이 한눈에 구분되게 한다. */}
                            {head && <p className="text-base font-semibold text-gray-900">{head}</p>}
                            <p className={`${head ? "mt-1.5 text-sm text-gray-500" : "text-[15px] text-gray-700"} leading-relaxed`}>{body}</p>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

// 짧은 기능 목록은 2열 카드로 모아 한눈에 훑어보게 한다.
function FeatureGrid({ title, items }: { title: string; items: string[] }) {
    return (
        <section>
            <SectionTitle title={title} />
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {items.map((item) => {
                    const { head, body } = splitKeyed(item);
                    return (
                        <li key={item} className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
                            <p className="text-[15px] font-bold tracking-tight text-gray-900">{head ?? body}</p>
                            {head && <p className="mt-1 text-sm leading-relaxed text-gray-500">{body}</p>}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

// 층 사이 연결. "프로토콜: 오가는 것" 이면 프로토콜을 굵게 보여준다.
function LayerFlow({ flow }: { flow: string }) {
    const { head, body } = splitKeyed(flow);
    return (
        <div className="flex flex-col items-center py-1" aria-label={`다음 층과 주고받는 것: ${flow}`}>
            <span className="h-3 w-px bg-gray-300" aria-hidden />
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-sm">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                <span className="text-center">
                    {head && <strong className="font-semibold text-gray-900">{head} </strong>}
                    {body}
                </span>
            </div>
            <span className="h-3 w-px bg-gray-300" aria-hidden />
        </div>
    );
}

// 위에서 아래로 쌓은 층을 색 박스로, 구성 요소를 아이콘 카드로, 층 사이를 양방향 연결로 그린다.
function ArchitectureSection({ architecture }: { architecture: ProjectArchitecture }) {
    return (
        <section>
            <SectionTitle title="Architecture" />
            <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{architecture.summary}</p>
            <div className="mt-5">
                {architecture.layers.map((layer, layerIndex) => {
                    const color = LAYER_COLORS[layerIndex % LAYER_COLORS.length];
                    return (
                        <div key={layer.name}>
                            <div className={`rounded-2xl border p-4 ${color.box}`}>
                                <p className={`flex items-center gap-2 text-sm font-semibold ${color.label}`}>
                                    <span className={`h-2 w-2 rounded-full ${color.dot}`} aria-hidden />
                                    {layer.name}
                                </p>
                                <div className={`mt-3 grid gap-2.5 sm:grid-cols-2 ${NODE_COLUMNS[layer.nodes.length] ?? "lg:grid-cols-3"}`}>
                                    {layer.nodes.map((node) => {
                                        const Icon = node.icon ? ARCHITECTURE_ICONS[node.icon] : undefined;
                                        return (
                                            <div key={node.name} className="flex gap-3 rounded-xl border border-white bg-white p-3 shadow-sm">
                                                {Icon && (
                                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color.icon}`}>
                                                        <Icon className="h-4 w-4" aria-hidden />
                                                    </span>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold leading-snug text-gray-900">{node.name}</p>
                                                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{node.detail}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {layer.flow && <LayerFlow flow={layer.flow} />}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// 요청 하나가 구성 요소를 거쳐 가는 순서를 번호와 세로선으로 잇는다. 처음과 끝 단계만 진하게 칠한다.
function RequestFlowSection({ steps }: { steps: ArchitectureStep[] }) {
    const lastIndex = steps.length - 1;
    return (
        <section>
            <SectionTitle title="Request Flow" />
            <ol className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                {steps.map((step, index) => (
                    <li key={step.name} className="relative flex gap-4 pb-6 last:pb-0">
                        {index < lastIndex && <span className="absolute bottom-0 left-[15px] top-9 w-px bg-gray-200" aria-hidden />}
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                index === 0 || index === lastIndex ? "bg-gray-900 text-white" : "border border-gray-300 bg-white text-gray-700"
                            }`}
                        >
                            {index + 1}
                        </span>
                        <div className="pt-1">
                            <p className="text-[15px] font-semibold text-gray-900">{step.name}</p>
                            <p className="mt-1 text-sm leading-relaxed text-gray-600">{step.detail}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="py-3 first:pt-0 last:pb-0">
            <dt className="text-xs text-gray-400">{label}</dt>
            <dd className="mt-1.5 text-sm text-gray-800">{children}</dd>
        </div>
    );
}

export default function ProjectDetailPage({ project }: ProjectDetailProps) {
    const canonical = `https://eottabom.github.io/side-projects/${project.slug}/`;
    // 설명은 줄마다 한 문장씩 적는다. 첫 줄은 개요, 나머지 줄은 시작한 이유나 배포 이력이다.
    // 화면에서는 줄마다 따로 그리고, 검색엔진용 설명에는 한 줄로 이어 붙인다.
    const descriptionLines = project.description.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const plainDescription = descriptionLines.map((line) => (/[.!?]$/.test(line) ? line : `${line}.`)).join(" ");
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: project.title,
        description: plainDescription,
        url: canonical,
        dateCreated: project.date,
        keywords: project.tags,
    };
    const externalLinks = [
        ...(project.demo ? [{ label: "Live Demo", url: project.demo }] : []),
        ...(project.links ?? []),
    ];

    return (
        <>
            <Header />
            <Seo
                title={project.title}
                description={plainDescription}
                ogType="article"
                publishedTime={project.date}
                ogImage={project.thumbnail}
                tags={project.tags}
                jsonLd={jsonLd}
            />

            {/* 목록 페이지와 같은 밝은 히어로. 태그는 오른쪽 정보 패널의 Tech Stack 과 겹쳐서 두지 않는다. */}
            <div className="bg-gradient-to-b from-sky-50 via-emerald-50/40 to-white">
                <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6">
                    <Link href="/side-projects/" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                        Side Projects
                    </Link>
                    <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                        <span>{project.date}</span>
                        <ProjectStatusBadge status={project.status} />
                    </div>
                    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{project.title}</h1>
                    {/* 개요 한 줄은 크게, 그 아래 문장들은 한 줄씩 작고 연하게 둔다. */}
                    {descriptionLines[0] && <p className="mt-4 text-xl font-medium leading-relaxed text-gray-800">{descriptionLines[0]}</p>}
                    {descriptionLines.length > 1 && (
                        <div className="mt-2 space-y-1">
                            {descriptionLines.slice(1).map((line) => (
                                <p key={line} className="text-base leading-relaxed text-gray-500">
                                    {line}
                                </p>
                            ))}
                        </div>
                    )}
                    {project.aiAssisted && (
                        <p className="mt-3 text-sm text-gray-400">Some parts of this project were developed with the assistance of AI tools.</p>
                    )}

                    {/* 주 버튼은 GitHub 하나만 두고, 나머지 링크는 같은 줄의 가벼운 텍스트 링크로 둔다. */}
                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                        {project.github && (
                            <a
                                href={project.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                            >
                                <Github className="h-4 w-4" aria-hidden />
                                View GitHub
                            </a>
                        )}
                        {externalLinks.map((link) => (
                            <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-900 hover:decoration-gray-500"
                            >
                                {link.label}
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* 본문을 넓게 쓰려고 목록 페이지보다 넓은 폭(6xl)을 쓰고, 정보 패널은 오른쪽 끝에 좁게 둔다. */}
            <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
                {project.thumbnail && (
                    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={project.thumbnail} alt={`${project.title} 데모`} className="w-full rounded-2xl" loading="lazy" />
                    </div>
                )}

                {/* 넓은 화면은 왼쪽 본문, 오른쪽 정보 패널. 좁은 화면은 정보 패널을 본문 위에 둔다.
                    좁은 화면도 열 폭을 minmax(0, 1fr) 로 묶는다. 그러지 않으면 가로로 긴 슬라이드 트랙에 맞춰 열이 화면보다 넓어진다. */}
                <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-14">
                    <div className="order-2 space-y-12 lg:order-1">
                        {project.problem && <DetailSection title="Why I Built It" content={project.problem} />}
                        {project.architecture && <ArchitectureSection architecture={project.architecture} />}
                        {project.architecture?.steps && project.architecture.steps.length > 0 && <RequestFlowSection steps={project.architecture.steps} />}
                        {project.approach && <DetailSection title="Approach" content={project.approach} />}
                        {project.features.length > 0 && <FeatureGrid title="Key Features" items={project.features} />}
                        {project.screenshots && project.screenshots.length > 0 && <ScreenshotCarousel screenshots={project.screenshots} />}
                        {project.sections?.map((section) => (
                            <DetailSection key={section.title} title={section.title} content={section.items} />
                        ))}
                        {project.role && <DetailSection title="My Role" content={project.role} />}
                        {project.whatILearned && <DetailSection title="What I Learned" content={project.whatILearned} />}
                    </div>

                    <aside className="order-1 self-start rounded-2xl border border-gray-200 bg-white p-6 lg:sticky lg:top-24 lg:order-2">
                        <dl className="divide-y divide-gray-100">
                            <InfoRow label="Status">
                                <ProjectStatusBadge status={project.status} />
                            </InfoRow>
                            <InfoRow label="Started">{project.date}</InfoRow>
                            {project.techStack && project.techStack.length > 0 && (
                                <InfoRow label="Tech Stack">
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.techStack.map((tech) => (
                                            <TechChip key={tech}>{tech}</TechChip>
                                        ))}
                                    </div>
                                </InfoRow>
                            )}
                            {(project.github || externalLinks.length > 0) && (
                                <InfoRow label="Links">
                                    <ul className="space-y-1.5">
                                        {project.github && (
                                            <li>
                                                <a href={project.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-gray-700 hover:text-blue-600">
                                                    <Github className="h-3.5 w-3.5" aria-hidden />
                                                    GitHub
                                                </a>
                                            </li>
                                        )}
                                        {externalLinks.map((link) => (
                                            <li key={link.url}>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-gray-700 hover:text-blue-600">
                                                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                                                    {link.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </InfoRow>
                            )}
                        </dl>
                    </aside>
                </div>
            </main>
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
