import Link from 'next/link';
import type { BookMeta } from '../lib/books';

function Stars({ rating = 0 }: { rating?: number }) {
    const r = Math.max(0, Math.min(5, Math.round(rating)));
    return (
        <div aria-label={`rating ${r} of 5`} className="text-sm">
            {'★★★★★☆☆☆☆☆'.slice(5 - r, 10 - r)}
        </div>
    );
}

export default function BookCard({ meta }: { meta: BookMeta }) {
    return (
        <article className="w-full rounded-2xl border p-6 md:p-7 mb-8 shadow-sm bg-white/60 dark:bg-zinc-900/60 backdrop-blur">
            <Link href={`/book/${meta.slug}`} >
                <div className="grid grid-cols-[96px_1fr] sm:grid-cols-[112px_1fr] lg:grid-cols-[128px_1fr] gap-6 sm:gap-8">
                    {meta.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={meta.cover}
                            alt={meta.title}
                            className="w-24 h-32 sm:w-28 sm:h-36 lg:w-32 lg:h-44 object-cover rounded-lg"
                            loading="lazy"
                        />
                    )}
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold leading-snug">
                            {meta.title}
                        </h2>
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            <time dateTime={meta.updated ?? meta.date}>
                                {meta.updated ?? meta.date}
                            </time>
                        </div>
                        {meta.summary && (
                            <p className="mt-3 leading-relaxed text-zinc-800 dark:text-zinc-200">
                                {meta.summary}
                            </p>
                        )}
                        {/* <div className="mt-2"><Stars rating={meta.rating} /></div> */}
                    </div>
                </div>
            </Link>
        </article>
    );
}
