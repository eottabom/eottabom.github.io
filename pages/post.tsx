import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { GetStaticProps } from 'next';
import { getPostsMetaOnly } from '../lib/posts';
import { Home } from 'lucide-react';

type Post = {
    id: string;
    title: string;
    summary?: string;
    description?: string;
    tags?: string[];
    date: string;
    updated?: string;
};

type Props = {
    postsByTag: Record<string, Post[]>;
    tagCounts: Record<string, number>;
};

const byDesc = (a: string | undefined, b: string | undefined) =>
    new Date(b ?? '1970-01-01').getTime() - new Date(a ?? '1970-01-01').getTime();

export const getStaticProps: GetStaticProps<Props> = async () => {
    const posts = getPostsMetaOnly();

    const byCreatedDesc = [...posts].sort((a, b) => byDesc(a.date, b.date));
    const byUpdatedDesc = [...posts].sort(
        (a, b) => byDesc(a.updated ?? a.date, b.updated ?? b.date)
    );

    const postsByTag: Record<string, Post[]> = {};
    const tagCounts: Record<string, number> = {};

    postsByTag['latest'] = posts;
    tagCounts['latest'] = posts.length;

    postsByTag['updated'] = byUpdatedDesc;
    tagCounts['updated'] = byUpdatedDesc.length;

    const grouped: Record<string, Post[]> = {};
    posts.forEach((post) => {
        (post.tags ?? []).forEach((tag) => {
            if (!grouped[tag]) grouped[tag] = [];
            grouped[tag].push(post);
        });
    });

    Object.keys(grouped).forEach((tag) => {
        grouped[tag].sort((a, b) => byDesc(a.updated ?? a.date, b.updated ?? b.date));
        postsByTag[tag] = grouped[tag];
        tagCounts[tag] = grouped[tag].length;
    });

    return {
        props: { postsByTag, tagCounts },
    };
};

export default function PostPage({ postsByTag, tagCounts }: Props) {
    const [selectedTag, setSelectedTag] = useState("latest");
    const [visibleCount, setVisibleCount] = useState(10);
    const [gradientStyle, setGradientStyle] = useState("");

    // 검색 상태
    const [query, setQuery] = useState("");
    const [globalSearch, setGlobalSearch] = useState(false); // 전체 검색 토글

    // 원본 목록(태그 or 전체)
    const basePosts = useMemo(() => {
        return globalSearch ? (postsByTag['latest'] || []) : (postsByTag[selectedTag] || []);
    }, [globalSearch, postsByTag, selectedTag]);

    // 검색 매칭 함수 (대소문자 무시, title/summary/description/tags 전부 검색)
    const matches = (post: Post, q: string) => {
        if (!q) return true;
        const needle = q.trim().toLowerCase();
        if (!needle) return true;

        const haystack = [
            post.title,
            post.summary,
            post.description,
            ...(post.tags || [])
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return haystack.includes(needle);
    };

    // 필터링된 목록
    const filteredPosts = useMemo(() => {
        return basePosts.filter(p => matches(p, query));
    }, [basePosts, query]);

    // 페이징
    const visiblePosts = filteredPosts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredPosts.length;

    const title = selectedTag === "latest"
        ? "Latest Posts"
        : selectedTag === "updated"
        ? "Recently Updated"
        : `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} Posts`;

    const description = selectedTag === "latest"
        ? "Check out the latest posts — and filter by tag if you'd like."
        : selectedTag === "updated"
        ? "Posts sorted by last updated timestamp (falls back to created date)."
        : `Posts related to the '${selectedTag}' category.`;

    const gradientOptions = [
        "from-yellow-400 to-pink-500",
        "from-green-400 to-blue-500",
        "from-indigo-500 to-purple-500",
        "from-pink-500 to-red-500",
        "from-sky-400 to-cyan-600",
        "from-orange-400 to-rose-500",
        "from-teal-400 to-emerald-500",
        "from-violet-500 to-fuchsia-500",
    ];

    useEffect(() => {
        if (selectedTag !== "latest") {
            const random = gradientOptions[Math.floor(Math.random() * gradientOptions.length)];
            setGradientStyle(`bg-gradient-to-r ${random}`);
        }
    }, [selectedTag]);

    // 태그 목록
    const otherTags = Object.keys(tagCounts).filter(t => t !== 'latest' && t !== 'updated');
    const tagList = [
        'latest',
        'updated',
        ...otherTags.sort((a, b) => a.localeCompare(b))
    ];

    // 태그 변경 시 검색/페이지 초기화
    const handleSelectTag = (tag: string) => {
        setSelectedTag(tag);
        setVisibleCount(10);
        if (!globalSearch) {
            setQuery("");
        }
    };

    return (
        <>
            <main>
                {/* 상단 영역만 배경색 적용 */}
                <div
                    className={`${selectedTag !== 'latest' ? gradientStyle : 'bg-white'} ${selectedTag !== 'latest' ? 'text-white' : 'text-black'}`}>
                    <Header />
                    {/* PostSection */}
                    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                        <h1 className={`text-5xl font-extrabold tracking-tight mb-4 ${selectedTag === "latest" ? "text-gray-900" : "text-white"}`}>
                            {title}
                        </h1>
                        <p className={`text-lg ${selectedTag === "latest" ? "text-gray-500" : "text-white"}`}>
                            {description}
                        </p>

                        {/* 검색 바 + 전체 검색 토글 */}
                        <div className="mt-8 flex flex-col items-center gap-3">
                            <div className="w-full max-w-2xl">
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setVisibleCount(10); }}
                                    placeholder={globalSearch ? "전체 글에서 검색..." : `${selectedTag} 태그에서 검색...`}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3.5
                                            text-base sm:text-lg font-medium
                                            text-black placeholder-gray-400
                                            outline-none focus:ring-2 focus:ring-blue-500"
                                    aria-label="검색"
                                />
                            </div>
                            {/* 토글 스위치 */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={globalSearch}
                                    onClick={() => { setGlobalSearch(v => !v); setVisibleCount(10); }}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors
                                        ${globalSearch ? 'bg-gray-900' : 'bg-gray-300'}
                                        focus:outline-none focus:ring-2 focus:ring-blue-500
                                    `}
                                    title="전체 검색 (모든 글 대상)"
                                >
                                    <span
                                        className={`
                                            inline-block h-6 w-6 transform rounded-full bg-white shadow
                                            transition-transform duration-200
                                            ${globalSearch ? 'translate-x-7' : 'translate-x-1'}
                                        `}
                                    />
                                    <span className="sr-only">전체 검색</span>
                                </button>
                                <span className="text-sm sm:text-base font-medium">
                                  전체 검색 (모든 글 대상)
                                </span>
                            </div>

                            {/* 결과 요약 */}
                            <p className="text-sm sm:text-base font-semibold text-gray-700 mt-1">
                                {(() => {
                                    const label = globalSearch ? "전체" : selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1);
                                    const count = filteredPosts.length;
                                    return query
                                        ? `${label}: ${count} 개 글 (검색어: "${query}")`
                                        : "";
                                })()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tag 필터 탭 */}
                <div className="py-6 px-4 sm:px-6 lg:px-8 bg-white">
                    <nav className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-6xl mx-auto">
                        {tagList.map(tag => {
                            const isActive = selectedTag === tag && !globalSearch; // 전체 검색 중이면 활성 표시 해제
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleSelectTag(tag)}
                                    className={
                                        `capitalize px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150
                                        ${isActive ? "bg-gray-800 text-white shadow-sm"
                                            : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"}
                                    `}
                                    disabled={globalSearch} // 전체 검색 중엔 태그 선택 비활성화
                                    title={globalSearch ? "전체 검색 중에는 태그 선택이 비활성화됩니다." : undefined}
                                >
                                    {tag.charAt(0).toUpperCase() + tag.slice(1)} ({tagCounts[tag]})
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* 카드 리스트 영역 */}
                <div className="card-section max-w-6xl mx-auto px-4 pb-16 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                        {visiblePosts.map(({id, title, summary, description, date, updated}) => (
                            <Link key={id} href={`/post/${id}`} legacyBehavior>
                                <a className="group flex flex-col justify-between p-6 min-h-[200px] rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-gray-50 transition duration-200 ease-in-out">
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-extrabold leading-snug text-gray-900 group-hover:text-blue-600 transition">
                                            {title}
                                        </h2>
                                        {summary && <p className="text-blue-500 text-sm font-medium">{summary}</p>}
                                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{description}</p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4">
                                        Posted Date: {date}
                                        {updated && updated !== date && (<> ・ Updated: {updated}</>)}
                                    </p>
                                </a>
                            </Link>
                        ))}
                    </div>

                    {/* 더 보기 버튼 */}
                    {hasMore && (
                        <div className="mt-10 text-center">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 10)}
                                className="px-6 py-2 text-sm font-medium rounded-full bg-black text-white hover:bg-gray-800 transition"
                            >
                                더 보기
                            </button>
                        </div>
                    )}

                    {/* 검색 결과가 없을 때 */}
                    {!filteredPosts.length && (
                        <div className="mt-10 text-center text-sm text-gray-500">
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>
            </main>

            <Link
                href="/"
                className="fixed bottom-6 right-6 z-50 bg-white border border-gray-300 rounded-lg shadow-md p-3 hover:shadow-lg transition"
                aria-label="홈으로 가기"
            >
                <Home className="w-6 h-6 text-gray-800"/>
            </Link>
        </>
    );
}
