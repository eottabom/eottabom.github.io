import type { GetStaticPaths, GetStaticProps } from "next";
import RedirectPage from "../../components/RedirectPage";
import { getProjectSlugs } from "../../lib/projects";

export default function ProjectRedirect({ slug }: { slug: string }) {
    return <RedirectPage to={`/side-projects/${slug}/`} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: getProjectSlugs().map((slug) => ({ params: { slug } })),
        fallback: false,
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    return {
        props: {
            slug: params?.slug as string,
        },
    };
};
