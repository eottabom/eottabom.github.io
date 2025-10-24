import { useMemo, useState, useEffect } from "react";

export type Article = {
    title: string;
    url: string;
    category?: string;
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

export default function UsefulLinks({ articles }: { articles?: Article[] }) {
    const [selected, setSelected] = useState<string>("All");

    useEffect(() => {
        if (typeof window === "undefined") { return; } else {
            const p = new URLSearchParams(window.location.search);
            const init = p.get("category") || "All";
            setSelected(init);
        }
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
                const category = a.category?.trim() || "Uncategorized";
                return { ...a, category };
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

    const chips = useMemo(() => {
        const counts = new Map<string, number>();
        for (const a of safeArticles) {
            const k = a.category!;
            counts.set(k, (counts.get(k) ?? 0) + 1);
        }
        const cats = Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name));
        return [{ name: "All", count: safeArticles.length }, ...cats];
    }, [safeArticles]);

    const filtered = useMemo(() => {
        const base = selected === "All"
            ? [...safeArticles]
            : safeArticles.filter((a) => a.category === selected);
        base.sort((a, b) => byAddedDesc(a.added, b.added));
        return base;
    }, [safeArticles, selected]);

    if (safeArticles.length === 0) {
        return <div className="text-center py-12 text-zinc-500">등록된 아티클이 없습니다.</div>;
    } else {
        return (
            <div className="space-y-6">
                <div className="py-2">
                    <nav className="flex flex-wrap justify-start gap-2 sm:gap-3">
                        {chips.map(({ name, count }) => {
                            const isActive = selected === name;
                            return (
                                <button
                                    key={name}
                                    onClick={() => { setSelected(name); }}
                                    className={`capitalize px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150
                                        ${isActive ? "bg-gray-800 text-white shadow-sm" : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"}
                                    `}
                                    aria-pressed={isActive}
                                >
                                    {name} ({count})
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <ol className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                    {filtered.map((a, idx) => (
                        <li key={`${a.url}-${idx}`}>
                            <a
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block px-4 py-3 sm:px-5 sm:py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
                                title={a.url}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500/90" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50 hover:text-zinc-700 dark:hover:text-zinc-200">
                                            {a.title}
                                        </p>
                                        {a.note ? (
                                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                                                {a.note}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                                        <span className="rounded-full border px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                                            {a.category}
                                        </span>
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
