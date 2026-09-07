import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Seo from '../components/Seo';
import { GetStaticProps } from 'next';
import { getPostsMetaOnly } from '../lib/posts';
import { Home, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

// 상단 히어로 그라데이션. 연한 색에서 흰색으로 빠지는 톤으로 통일한다.
// Tailwind JIT 때문에 클래스는 완성된 문자열로 둔다.
const GRADIENTS = [
    // 초록 · 청록 계열
    "from-emerald-50 via-teal-50/40 to-white",
    "from-teal-50 via-cyan-50/40 to-white",
    "from-lime-50 via-emerald-50/40 to-white",
    "from-green-50 via-teal-50/40 to-white",
    // 파랑 계열
    "from-cyan-50 via-sky-50/40 to-white",
    "from-sky-50 via-blue-50/40 to-white",
    "from-blue-50 via-indigo-50/40 to-white",
    "from-sky-50 via-emerald-50/40 to-white",
    // 보라 계열
    "from-indigo-50 via-violet-50/40 to-white",
    "from-violet-50 via-purple-50/40 to-white",
    "from-purple-50 via-fuchsia-50/40 to-white",
    "from-violet-50 via-sky-50/40 to-white",
    // 분홍 · 빨강 계열
    "from-fuchsia-50 via-pink-50/40 to-white",
    "from-pink-50 via-rose-50/40 to-white",
    "from-rose-50 via-orange-50/40 to-white",
    "from-red-50 via-amber-50/40 to-white",
    // 주황 · 노랑 계열
    "from-orange-50 via-amber-50/40 to-white",
    "from-amber-50 via-yellow-50/40 to-white",
    "from-yellow-50 via-lime-50/40 to-white",
    "from-orange-50 via-rose-50/40 to-white",
    // 중성 계열
    "from-slate-100 via-slate-50/40 to-white",
    "from-stone-100 via-amber-50/40 to-white",
    "from-zinc-100 via-slate-50/40 to-white",
    // 대비가 있는 조합
    "from-emerald-50 via-sky-50/40 to-white",
    "from-rose-50 via-violet-50/40 to-white",
    "from-amber-50 via-lime-50/40 to-white",
    "from-cyan-50 via-indigo-50/40 to-white",
    "from-pink-50 via-purple-50/40 to-white",
];

function TagScroller({ tagList, tagCounts, selectedTag, globalSearch, onSelect }: {
    tagList: string[];
    tagCounts: Record<string, number>;
    selectedTag: string;
    globalSearch: boolean;
    onSelect: (tag: string) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setShowLeft(el.scrollLeft > 4);
        setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        el?.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => {
            el?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll]);

    const scroll = (dir: number) => {
        scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
    };

    return (
        <div className="relative">
            {showLeft && (
                <button
                    onClick={() => scroll(-1)}
                    className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-start pl-1.5 bg-gradient-to-r from-white via-white/90 to-transparent"
                    aria-label="태그 왼쪽 스크롤"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
            )}
            <nav
                ref={scrollRef}
                className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 pb-0.5"
                aria-label="태그 필터"
            >
                {tagList.map(tag => {
                    const isActive = selectedTag === tag && !globalSearch;
                    return (
                        <button
                            key={tag}
                            onClick={() => onSelect(tag)}
                            className={`
                                flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium
                                transition-all duration-150 whitespace-nowrap
                                ${isActive
                                    ? "bg-gray-900 text-white"
                                    : globalSearch
                                        ? "bg-gray-50 text-gray-300 cursor-default"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }
                            `}
                            disabled={globalSearch}
                        >
                            {tag === 'latest' ? 'Latest' : tag === 'updated' ? 'Updated' : tag}
                            <span className={`ml-0.5 ${isActive ? "text-gray-400" : "text-gray-400"}`}>
                                {tagCounts[tag]}
                            </span>
                        </button>
                    );
                })}
            </nav>
            {showRight && (
                <button
                    onClick={() => scroll(1)}
                    className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-end pr-1.5 bg-gradient-to-l from-white via-white/90 to-transparent"
                    aria-label="태그 오른쪽 스크롤"
                >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
            )}
        </div>
    );
}

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

    const [query, setQuery] = useState("");
    const [globalSearch, setGlobalSearch] = useState(false);
    const [gradientIndex, setGradientIndex] = useState(0);

    // 첫 렌더는 서버와 같은 값으로 두고, 마운트 후에 랜덤으로 바꾼다(hydration 불일치 방지).
    useEffect(() => {
        setGradientIndex(Math.floor(Math.random() * GRADIENTS.length));
    }, []);

    const basePosts = useMemo(() => {
        return globalSearch ? (postsByTag['latest'] || []) : (postsByTag[selectedTag] || []);
    }, [globalSearch, postsByTag, selectedTag]);

    const matches = (post: Post, q: string) => {
        if (!q) return true;
        const needle = q.trim().toLowerCase();
        if (!needle) return true;
        const haystack = [post.title, post.summary, post.description, ...(post.tags || [])]
            .filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(needle);
    };

    const filteredPosts = useMemo(() => {
        return basePosts.filter(p => matches(p, query));
    }, [basePosts, query]);

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

    const tagGradient = `bg-gradient-to-b ${GRADIENTS[gradientIndex % GRADIENTS.length]}`;

    const otherTags = Object.keys(tagCounts).filter(t => t !== 'latest' && t !== 'updated');
    const tagList = ['latest', 'updated', ...otherTags.sort((a, b) => a.localeCompare(b))];

    const handleSelectTag = (tag: string) => {
        setSelectedTag(tag);
        setGradientIndex(Math.floor(Math.random() * GRADIENTS.length));
        setVisibleCount(10);
        if (!globalSearch) setQuery("");
    };

    const clearQuery = () => {
        setQuery("");
        setVisibleCount(10);
    };

    return (
        <>
            <Seo
              title="Posts"
              description="Java, Spring, gRPC, Kubernetes, DDD 등 백엔드 개발 글 목록 - 태그별 필터와 검색으로 원하는 글을 찾아보세요."
            />
            <Header />
            <main>
                {/* 상단 영역 */}
                <div
                    className={`${tagGradient} text-gray-800`}>
                    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            {title}
                        </h1>
                        <p className={`mt-2 text-sm ${selectedTag === "latest" ? "text-gray-400" : "text-gray-700"}`}>
                            {description}
                        </p>
                    </div>
                </div>

                {/* 검색 + 태그 (sticky) */}
                <div className="bg-white/90 backdrop-blur-md sticky top-14 z-30">
                    <div className="max-w-5xl mx-auto px-4 py-3 space-y-4 border-b border-gray-200 shadow-sm">
                        {/* 검색바 */}
                        <div className="flex items-center justify-center gap-3">
                            <div className={`w-full max-w-sm relative rounded-full p-[1.5px] transition-all duration-300 ${
                                query
                                    ? "bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500"
                                    : "bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300"
                            }`}>
                                <div className="relative bg-white rounded-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="search"
                                        value={query}
                                        onChange={(e) => { setQuery(e.target.value); setVisibleCount(10); }}
                                        placeholder="글 제목, 태그, 키워드로 검색"
                                        className="w-full pl-9 pr-8 py-2 rounded-full bg-transparent
                                            text-sm text-black placeholder-gray-400
                                            outline-none"
                                        aria-label="검색"
                                    />
                                    {query && (
                                        <button
                                            onClick={clearQuery}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            aria-label="검색어 지우기"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* 전체 검색 토글 */}
                            <button
                                type="button"
                                role="switch"
                                aria-checked={globalSearch}
                                onClick={() => { setGlobalSearch(v => !v); setVisibleCount(10); }}
                                className="flex-shrink-0 flex items-center gap-2"
                            >
                                <span className={`
                                    relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200
                                    ${globalSearch ? "bg-green-500" : "bg-gray-300"}
                                `}>
                                    <span className={`
                                        inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform duration-200
                                        ${globalSearch ? "translate-x-[18px]" : "translate-x-[3px]"}
                                    `} />
                                </span>
                                <span className="text-xs text-gray-500 whitespace-nowrap">전체</span>
                            </button>

                            {query && (
                                <span className="flex-shrink-0 text-xs text-gray-400">{filteredPosts.length}건</span>
                            )}
                        </div>

                        {/* 태그 */}
                        <TagScroller
                            tagList={tagList}
                            tagCounts={tagCounts}
                            selectedTag={selectedTag}
                            globalSearch={globalSearch}
                            onSelect={handleSelectTag}
                        />
                    </div>
                </div>

                {/* 카드 리스트 영역 (기존 유지) */}
                <div className="card-section max-w-6xl mx-auto px-4 pt-8 pb-16 bg-white">
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
