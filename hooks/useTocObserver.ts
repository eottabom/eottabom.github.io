import { useEffect, useState } from 'react';

type TocItem = {
    id: string;
    text: string;
    level: number;
};

export function useTocObserver(): [TocItem[], string] {
    const [toc, setToc] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const headers = Array.from(document.querySelectorAll('h2[id], h3[id]')) as HTMLHeadingElement[];

        const items = headers.map((h) => ({
            id: h.id,
            text: h.textContent ?? '',
            level: Number(h.tagName[1]),
        }));
        setToc(items);

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((entry) => entry.isIntersecting);
                if (visible?.target.id) {
                    setActiveId(visible.target.id);
                }
            },
            {
                rootMargin: '0px 0px -80% 0px',
                threshold: 1.0,
            }
        );

        headers.forEach((h) => observer.observe(h));
        return () => observer.disconnect();
    }, []);

    return [toc, activeId];
}
