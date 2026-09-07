import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

export type Article = {
    title: string;
    url: string;
    category?: string | string[];
    keywords?: string[];
    source?: string;
    note?: string;
    added?: string; // YYYY-MM-DD
};

// 카테고리별 뱃지 색상. Tailwind JIT 때문에 클래스는 완성된 문자열로 둔다.
const CATEGORY_BADGE: Record<string, string> = {
    "AI":          "bg-violet-50 text-violet-700 border-violet-200",
    "Claude":      "bg-orange-50 text-orange-700 border-orange-200",
    "Career":      "bg-rose-50 text-rose-700 border-rose-200",
    "Clean Code":  "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Code Review": "bg-blue-50 text-blue-700 border-blue-200",
    "SRE":         "bg-cyan-50 text-cyan-700 border-cyan-200",
};

const FALLBACK_BADGE = "bg-zinc-50 text-zinc-600 border-zinc-200";

function categoryBadge(name: string) {
    return CATEGORY_BADGE[name] ?? FALLBACK_BADGE;
}

function byAddedDesc(a?: string, b?: string) {
    const av = (a ?? "").trim();
    const bv = (b ?? "").trim();
    if (!av && !bv) { return 0; }
    if (!av) { return 1; }
    if (!bv) { return -1; }
    const ad = new Date(av).getTime() || 0;
    const bd = new Date(bv).getTime() || 0;
    return bd - ad;
}

function getSourceFromUrl(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "unknown";
    }
}

export default function ReadAndKeep({ articles }: { articles?: Article[] }) {
    const [selected, setSelected] = useState<string>("All");
    const [query, setQuery] = useState<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") { return; } else {
            const p = new URLSearchParams(window.location.search);
            const init = p.get("category") || "All";
            setSelected(init);
            setQuery(p.get("q") || "");
        }
    }, []);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setShowLeft(el.scrollLeft > 4);
        setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    const safeArticles = useMemo(() => {
        const arr = Array.isArray(articles) ? articles : [];
        return arr
            .filter((a) => {
                if (!a) { return false; }
                if (typeof a.title !== "string") { return false; }
                if (typeof a.url !== "string") { return false; }
                return true;
            })
            .map((a) => {
                const raw = a.category;
                const categories = Array.isArray(raw)
                    ? raw.map((c) => c?.trim()).filter(Boolean) as string[]
                    : [raw?.trim()].filter(Boolean) as string[];
                const keywords = Array.isArray(a.keywords)
                    ? a.keywords.map((k) => k?.trim()).filter(Boolean) as string[]
                    : [];
                return {
                    ...a,
                    categories: categories.length ? categories : ["Uncategorized"],
                    keywords,
                };
            });
    }, [articles]);

    useEffect(() => {
        if (typeof window === "undefined") { return; } else {
            const url = new URL(window.location.href);
            if (selected === "All") {
                url.searchParams.delete("category");
            } else {
                url.searchParams.set("category", selected);
            }
            if (query.trim()) {
                url.searchParams.set("q", query.trim());
            } else {
                url.searchParams.delete("q");
            }
            window.history.replaceState({}, "", url.toString());
        }
    }, [selected, query]);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        el?.addEventListener("scroll", checkScroll, { passive: true });
        window.addEventListener("resize", checkScroll);
        return () => {
            el?.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [checkScroll, safeArticles.length, selected]);

    const scroll = (dir: number) => {
        scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
    };

    // 검색어는 공백으로 나눠 모두 포함(AND)하는 항목만 남긴다.
    const searched = useMemo(() => {
        const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length === 0) { return safeArticles; }
        return safeArticles.filter((a) => {
            const haystack = [
                a.title,
                a.note ?? "",
                a.source ?? "",
                getSourceFromUrl(a.url),
                a.keywords.join(" "),
                a.categories.join(" "),
            ].join(" ").toLowerCase();
            return terms.every((t) => haystack.includes(t));
        });
    }, [safeArticles, query]);

    const chips = useMemo(() => {
        const counts = new Map<string, number>();
        for (const a of searched) {
            for (const k of a.categories) {
                counts.set(k, (counts.get(k) ?? 0) + 1);
            }
        }
        const cats = Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return [{ name: "All", count: searched.length }, ...cats];
    }, [searched]);

    const filtered = useMemo(() => {
        const base = selected === "All"
            ? [...searched]
            : searched.filter((a) => a.categories.includes(selected));
        base.sort((a, b) => byAddedDesc(a.added, b.added));
        return base;
    }, [searched, selected]);

    if (safeArticles.length === 0) {
        return <div className="text-center py-12 text-zinc-500">등록된 아티클이 없습니다.</div>;
    } else {
        return (
            <div className="space-y-6">
                <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-14 z-30">
                    <div className="max-w-5xl mx-auto px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="relative min-w-0 flex-1">
                            {showLeft && (
                                <button
                                    onClick={() => scroll(-1)}
                                    className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-start pl-1.5 bg-gradient-to-r from-white via-white/90 to-transparent"
                                    aria-label="카테고리 왼쪽 스크롤"
                                >
                                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                                </button>
                            )}
                            <nav
                                ref={scrollRef}
                                className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 pb-0.5"
                                aria-label="카테고리 필터"
                            >
                                {chips.map(({ name, count }) => {
                                    const isActive = selected === name;
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => { setSelected(name); }}
                                            className={`
                                                flex-shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium
                                                transition-all duration-150 whitespace-nowrap
                                                ${isActive
                                                    ? "bg-gray-900 text-white"
                                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                }
                                            `}
                                            aria-pressed={isActive}
                                        >
                                            {name}
                                            <span className="ml-0.5 text-gray-400">{count}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                            {showRight && (
                                <button
                                    onClick={() => scroll(1)}
                                    className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-end pr-1.5 bg-gradient-to-l from-white via-white/90 to-transparent"
                                    aria-label="카테고리 오른쪽 스크롤"
                                >
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                </button>
                            )}
                        </div>

                        {/* 검색바 */}
                    <div className="flex items-center gap-2 shrink-0 sm:w-72">
                            <div className={`w-full relative rounded-full p-[1.5px] transition-all duration-300 ${
                                query
                                    ? "bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500"
                                    : "bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300"
                            }`}>
                                <div className="relative bg-white rounded-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="search"
                                        value={query}
                                        onChange={(e) => { setQuery(e.target.value); }}
                                        placeholder="제목, 키워드, 요약, 출처로 검색"
                                        className="w-full pl-9 pr-8 py-2 rounded-full bg-transparent
                                            text-sm text-black placeholder-gray-400
                                            outline-none"
                                        aria-label="검색"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => { setQuery(""); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            aria-label="검색어 지우기"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {query && (
                                <span className="flex-shrink-0 text-xs text-gray-400">{filtered.length}건</span>
                            )}
                        </div>
                        </div>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="mt-8 rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-500">
                        검색 결과가 없습니다.
                    </div>
                ) : null}

                <ol className={`mt-8 rounded-xl border border-zinc-200 divide-y divide-zinc-200 overflow-hidden bg-white ${filtered.length === 0 ? "hidden" : ""}`}>
                    {filtered.map((a, idx) => (
                        <li key={`${a.url}-${idx}`}>
                            <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block px-4 py-3 sm:px-5 sm:py-4 hover:bg-zinc-50 transition"
                                title={a.url}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500/90" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-zinc-900 hover:text-zinc-700">
                                            {a.title}
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            source : {a.source?.trim() || getSourceFromUrl(a.url)}
                                        </p>
                                        {a.keywords.length > 0 ? (
                                            <p className="mt-1 text-xs text-zinc-500">
                                                keywords : {a.keywords.join(", ")}
                                            </p>
                                        ) : null}
                                        {a.note ? (
                                            <p className="mt-1 text-sm text-indigo-700 line-clamp-2">
                                                {a.note}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                        <div className="flex flex-wrap justify-end gap-1">
                                            {a.categories.map((category) => (
                                                <span
                                                    key={`${a.url}-${category}`}
                                                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryBadge(category)}`}
                                                >
                                                    {category}
                                                </span>
                                            ))}
                                        </div>
                                        {a.added ? (
                                        <span className="text-[11px] text-zinc-500">
                                            added : {a.added}
                                        </span>
                                        ) : null}
                                    </div>
                                </div>
                            </a>
                        </li>
                    ))}
                </ol>

                {filtered.length === 0 ? (
                    <p className="text-center text-zinc-500 py-10">선택한 카테고리에 해당하는 아티클이 없습니다.</p>
                ) : null}
            </div>
        );
    }
}
