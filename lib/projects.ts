import projectData from "../contents/projects/data.json";

export type ProjectStatus = "active" | "archived" | "wip";

export type Project = {
    slug: string;
    title: string;
    date: string;
    status: ProjectStatus;
    summary: string;
    description: string;
    problem?: string;
    approach?: string;
    whatILearned?: string;
    tags: string[];
    features: string[];
    thumbnail?: string;
    github?: string;
    demo?: string;
    role?: string;
    techStack?: string[];
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
