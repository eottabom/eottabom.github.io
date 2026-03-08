// pages/book/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next';
import { MDXRemote } from 'next-mdx-remote';
import Header from '../../components/Header';
import Seo from '../../components/Seo';
import Panel from '../../components/Panel';
import { BlueText, RedText, GreenText } from '../../components/Highlight';
import { useTocObserver } from '../../lib/useTocObserver';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { List } from 'lucide-react';

import { Tabs, Tab } from '../../components/Tabs';
import { getBookSlugs, getBookData, BookData } from '../../lib/books';

declare global {
    interface Window {
        adsbygoogle: unknown[];
    }
}

export default function BookDetail({mdxSource, slug, title, author, date, updated, summary, cover}: BookData) {
    const [toc, activeId] = useTocObserver();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollHint, setShowScrollHint] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (el && el.scrollHeight > el.clientHeight) {
            setShowScrollHint(true);
        }
    }, [toc]);

    useEffect(() => {
        setTimeout(() => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('Adsbygoogle push error:', e);
            }
        }, 500);
    }, []);

    const components = {
        info: (props: any) => <Panel type="info" {...props} />,
        warning: (props: any) => <Panel type="warning" {...props} />,
        danger: (props: any) => <Panel type="danger" {...props} />,
        success: (props: any) => <Panel type="success" {...props} />,
        note: (props: any) => <Panel type="note" {...props} />,
        tip: (props: any) => <Panel type="tip" {...props} />,
        neutral: (props: any) => <Panel type="neutral" {...props} />,
        quote: (props: any) => <Panel type="quote" {...props} />,
        BlueText,
        RedText,
        GreenText,
        Tabs,
        Tab,
        a: (props: any) => <a {...props} target="_blank" rel="noopener noreferrer" />,
    };

    const pageTitle = `${title} · Review`;
    const canonical = `https://eottabom.github.io/book/${slug}/`;
    const bookJsonLd = {
        "@context": "https://schema.org",
        "@type": "Book",
        name: title,
        author: author ? { "@type": "Person", name: author } : undefined,
        description: summary ?? title,
        image: cover ? `https://eottabom.github.io${cover}` : undefined,
        datePublished: date,
        dateModified: updated ?? date,
        url: canonical,
    };

    return (
        <>
            <Header />

            <Seo
              title={pageTitle}
              description={summary ?? title}
              ogType="article"
              publishedTime={date}
              modifiedTime={updated}
              ogImage={cover}
              jsonLd={bookJsonLd}
            />

            <div className="max-w-[90rem] mx-auto px-6 py-20 flex gap-16">
                {/* Main */}
                <main className="flex-1 prose prose-xl max-w-none">
                    <h1 className="text-4xl font-bold mb-4">{title}</h1>
                    <p className="text-gray-500 text-sm mb-8">
                        <time dateTime={updated ?? date}>{updated ?? date}</time>
                        {author ? ` · ${author}` : ''}
                    </p>

                    {/* 좌측 aside는 post처럼 사이드로 따로 — cover는 본문 상단에 넣고 싶으면 여기 표시 */}
                    {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={cover}
                            alt={title}
                            className="mx-auto mb-6
                                      w-48 sm:w-56 lg:w-64
                                      object-cover
                                      rounded-xl shadow-sm"
                            loading="lazy"
                            width={384} height={512} // CLS 방지용 대략치
                        />
                    )}

                    <article className="overflow-x-auto">
                        <MDXRemote {...mdxSource} components={components} />
                    </article>

                    {/* ads */}
                    <div className="mt-10 flex justify-center min-h-[100px]">
                        <div style={{ width: '100%', maxWidth: '728px', minHeight: '100px' }}>
                            <ins
                                className="adsbygoogle"
                                style={{ display: 'block', width: '100%', minHeight: '100px' }}
                                data-ad-client="ca-pub-5103032140213770"
                                data-ad-slot="3384415421"
                                data-ad-format="autorelaxed"
                            />
                        </div>
                    </div>
                </main>
            </div>

            {/* 목록으로 */}
            <Link
                href="/book"
                className="fixed bottom-6 right-6 z-50 bg-white border border-gray-300 rounded-lg shadow-md p-3 hover:shadow-lg transition"
                aria-label="목록으로 가기"
            >
                <List className="w-6 h-6 text-gray-800" />
            </Link>
        </>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const slugs = getBookSlugs();
    return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const slug = params?.slug as string;
    const data = await getBookData(slug);
    return { props: data };
};
