import projectData from "../contents/projects/data.json";

export type ProjectStatus = "active" | "archived" | "wip";

export type ProjectLink = {
    label: string;
    url: string;
};

// 아키텍처는 위에서 아래로 쌓은 층(layer)으로 적는다. 층 안에는 구성 요소를, 층 사이에는 무엇이 오가는지를 적는다.
// 상세 페이지에서 층을 박스로, 층 사이를 라벨 붙은 화살표로 그린다.
export type ArchitectureNode = {
    name: string;
    detail: string;
    // 다이어그램에서 이름 앞에 붙일 아이콘 이름. 상세 페이지의 아이콘 표에 있는 이름만 쓴다.
    icon?: string;
};

// 요청 하나가 구성 요소를 거쳐 가는 순서. 상세 페이지에서 번호 붙은 흐름으로 그린다.
export type ArchitectureStep = {
    name: string;
    detail: string;
};

export type ArchitectureLayer = {
    name: string;
    nodes: ArchitectureNode[];
    // 이 층에서 다음 층으로 가는 화살표에 붙일 설명. 마지막 층은 비워 둔다.
    flow?: string;
};

export type ProjectArchitecture = {
    summary: string;
    layers: ArchitectureLayer[];
    steps?: ArchitectureStep[];
};

// 설치, 사용법, 호환성처럼 프로젝트마다 다른 추가 섹션
export type ProjectSection = {
    title: string;
    items: string[];
};

export type ProjectScreenshot = {
    src: string;
    caption: string;
};

export type Project = {
    slug: string;
    title: string;
    date: string;
    status: ProjectStatus;
    summary: string;
    description: string;
    problem?: string | string[];
    approach?: string | string[];
    whatILearned?: string;
    tags: string[];
    features: string[];
    thumbnail?: string;
    github?: string;
    demo?: string;
    links?: ProjectLink[];
    role?: string;
    techStack?: string[];
    aiAssisted?: boolean;
    architecture?: ProjectArchitecture;
    screenshots?: ProjectScreenshot[];
    sections?: ProjectSection[];
};

type ProjectDataFile = {
    projects: Project[];
};

const projects = ((projectData as ProjectDataFile).projects ?? []).slice();

function byDescDate(a: Project, b: Project) {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function getProjects(): Project[] {
    return projects.slice().sort(byDescDate);
}

export function getProjectSlugs(): string[] {
    return projects.map((project) => project.slug);
}

export function getProjectBySlug(slug: string): Project {
    const project = projects.find((item) => item.slug === slug);
    if (!project) {
        throw new Error(`[projects] Not found: ${slug}`);
    }
    return project;
}
