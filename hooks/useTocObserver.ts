import { useEffect, useState } from 'react';

type TocItem = {
    id: string;
    text: string;
};

export function useTocObserver(): [TocItem[], string] {
    const [toc, setToc] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        const headers = Array.from(document.querySelectorAll('h3[id]')) as HTMLHeadingElement[];

        const items = headers.map((h) => ({
            id: h.id,
            text: h.textContent ?? '',
        }));
        setToc(items);

        const handleObserver = (entries: IntersectionObserverEntry[]) => {
            const visible = entries.find((entry) => entry.isIntersecting);
            if (visible?.target.id) {
                setActiveId(visible.target.id);
            }
        };

        const observer = new IntersectionObserver(handleObserver, {
            rootMargin: '0px 0px -80% 0px',
            threshold: 1.0,
        });

        headers.forEach((h) => observer.observe(h));

        return () => observer.disconnect();
    }, []);

    return [toc, activeId];
}
