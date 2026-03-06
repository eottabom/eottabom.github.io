import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Article = {
    title: string;
    url: string;
    category?: string | string[];
    source?: string;
    note?: string;
    added?: string; // YYYY-MM-DD
};

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
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") { return; } else {
            const p = new URLSearchParams(window.location.search);
            const init = p.get("category") || "All";
            setSelected(init);
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
                return { ...a, categories: categories.length ? categories : ["Uncategorized"] };
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
            window.history.replaceState({}, "", url.toString());
        }
    }, [selected]);

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

    const chips = useMemo(() => {
        const counts = new Map<string, number>();
        for (const a of safeArticles) {
            for (const k of a.categories) {
                counts.set(k, (counts.get(k) ?? 0) + 1);
            }
        }
        const cats = Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return [{ name: "All", count: safeArticles.length }, ...cats];
    }, [safeArticles]);

    const filtered = useMemo(() => {
        const base = selected === "All"
            ? [...safeArticles]
            : safeArticles.filter((a) => a.categories.includes(selected));
        base.sort((a, b) => byAddedDesc(a.added, b.added));
        return base;
    }, [safeArticles, selected]);

    if (safeArticles.length === 0) {
        return <div className="text-center py-12 text-zinc-500">등록된 아티클이 없습니다.</div>;
    } else {
        return (
            <div className="space-y-6">
                <div className="bg-white border-b border-gray-200 sticky top-14 z-30">
                    <div className="max-w-5xl mx-auto px-4 py-3">
                        <div className="relative">
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
                    </div>
                </div>

                <ol className="mt-8 rounded-xl border border-zinc-200 divide-y divide-zinc-200 overflow-hidden bg-white">
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
                                        {a.note ? (
                                            <p className="mt-1 text-sm text-zinc-600 line-clamp-2">
                                                {a.note}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                        <div className="flex flex-wrap justify-end gap-1">
                                            {a.categories.map((category) => (
                                                <span
                                                    key={`${a.url}-${category}`}
                                                    className="rounded-full border px-2 py-0.5 text-xs text-zinc-600"
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
