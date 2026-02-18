import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GetStaticProps } from 'next';
import { getPostsMetaOnly } from '../lib/posts';
import AdSense from '../components/AdSense';
import { catImages } from '../lib/mainImage';
import BookCard from '../components/BookCard';
import { getBooksMetaOnly, BookMeta } from '../lib/books';
import { useEffect, useState } from 'react';

type Post = {
    id: string;
    title: string;
    summary?: string;
    description?: string;
    date: string;
    updated?: string;
};

type HomeProps = {
    allPostsData: Post[];
    latestBook?: BookMeta | null;
};

function shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
    const allPostsData = getPostsMetaOnly();

    const books = getBooksMetaOnly?.() ?? [];
    const latestBook = books.length > 0 ? books[0] : null;

    return {
        props: {
            allPostsData,
            latestBook,
        },
    };
};

// 날짜 내림차순 비교 (undefined 안전)
const byDesc = (a?: string, b?: string) =>
    new Date(b ?? '1970-01-01').getTime() - new Date(a ?? '1970-01-01').getTime();

export default function Home({
                                 allPostsData,
                                 latestBook,
                             }: HomeProps) {
    if (!allPostsData.length) {
        return (
            <>
                <Header isDark={false} />
                <main className="max-w-3xl mx-auto px-6 py-24">
                    <h1 className="text-3xl font-bold">No posts yet</h1>
                </main>
                <Footer />
            </>
        );
    }

    // 최신 글(작성일 기준)
    const [latest, ...restAll] = allPostsData;

    // 최근 업데이트 글(업데이트일 없으면 작성일로 대체)
    const updatedSorted = [...allPostsData].sort((a, b) =>
        byDesc(a.updated ?? a.date, b.updated ?? b.date)
    );
    const updatedPost =
        updatedSorted.find((p) => p.id !== latest.id) ?? updatedSorted[0];

    const rest = restAll
        .filter((post) => post.id !== updatedPost.id)
        .slice(0, 3);

    const [bgImages, setBgImages] = useState<string[]>(
        () => Array(rest.length).fill('')
    );

    useEffect(() => {
        // rest 길이가 바뀌면 새로 셔플
        setBgImages(shuffle(catImages).slice(0, rest.length));
    }, [rest.length]);

    return (
        <>
            <div className="min-h-screen">
                <Header isDark={false} />

                {/* Hero */}
                <section className="text-center pt-40 pb-28 px-4">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
                        Hi, I’m a <strong>considerate developer</strong>.
                    </h1>
                    <p className="text-lg text-gray-600 leading-loose space-y-2">
                        I believe being considerate means writing{' '}
                        <strong>clean, readable code</strong>,<br />
                        building <strong>predictable and testable systems</strong>,<br />
                        and delivering <strong>reliable, trustworthy services</strong> that
                        users can depend on.<br />
                        <br />
                        I’m constantly <strong>learning and growing</strong> to become
                        better at this,<br />
                        and this blog is where I share my{' '}
                        <strong>journey as a learning developer</strong>.
                    </p>
                    <div className="mt-8">
                        <Link
                            href="/toolkit"
                            className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-semibold px-6 py-2 rounded transition"
                        >
                            View My Toolkit →
                        </Link>
                    </div>
                </section>

                <div className="bg-gray-50 pt-32 pb-20 px-4">
                    <main className="max-w-4xl mx-auto px-4 pb-32 space-y-24">
                        {/* Latest Post */}
                        <section>
                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-500 uppercase tracking-wide">
                                Latest Post
                            </span>

                            <h2 className="mt-4 text-3xl font-bold text-gray-900">
                                {latest.title}
                            </h2>

                            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                                {latest.summary || 'No summary provided.'}
                            </p>

                            {latest.description && (
                                <p className="mt-2 text-base text-gray-500 leading-relaxed">
                                    {latest.description}
                                </p>
                            )}

                            <Link
                                href={`/post/${latest.id}`}
                                className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition"
                            >
                                Continue Reading →
                            </Link>
                        </section>

                        {/* Recently Updated */}
                        <section>
                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-500 uppercase tracking-wide">
                                Recently Updated
                            </span>

                            <h2 className="mt-4 text-3xl font-bold text-gray-900">
                                {updatedPost.title}
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Updated: {updatedPost.updated ?? updatedPost.date}
                            </p>

                            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                                {updatedPost.summary || 'No summary provided.'}
                            </p>

                            {updatedPost.description && (
                                <p className="mt-2 text-base text-gray-500 leading-relaxed">
                                    {updatedPost.description}
                                </p>
                            )}

                            <Link
                                href={`/post/${updatedPost.id}`}
                                className="inline-block mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded transition"
                            >
                                Read Updated Post →
                            </Link>
                        </section>

                        <AdSense />

                        {/* Latest Book (1권) */}
                        {latestBook && (
                            <section>
                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-500 uppercase tracking-wide">
                                    Latest Book Review
                                </span>

                                <div className="mt-6 max-w-4xl">
                                    <BookCard meta={latestBook} />
                                </div>

                                <Link
                                    href="/book"
                                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded transition"
                                >
                                    Read All Books →
                                </Link>
                            </section>
                        )}

                        {/* More Posts */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-500 uppercase tracking-wide">
                                    More Posts
                                </span>
                                <Link
                                    href="/post"
                                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    Read all →
                                </Link>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                {rest.map(({ id, title }, idx) => (
                                    <Link key={id} href={`/post/${id}`}>
                                        <div
                                            className="flex flex-col justify-end p-6 h-48 sm:h-64 rounded-xl text-white shadow hover:shadow-xl transition"
                                            style={{
                                                backgroundImage: bgImages[idx]
                                                    ? `url(${bgImages[idx]})`
                                                    : undefined,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            <h3 className="text-lg font-semibold leading-snug bg-black/50 p-2 rounded">
                                                {title}
                                            </h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
}
