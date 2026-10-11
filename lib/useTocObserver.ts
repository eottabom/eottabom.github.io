import { useEffect, useState } from 'react';

type TocItem = {
    id: string;
    text: string;
    level: number;
};

// 고정 헤더(56px) + 여백. globals.css 의 scroll-padding-top 과 맞춘다.
const ACTIVE_OFFSET = 80;

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

        // 화면 상단(헤더 아래)을 지난 마지막 제목을 현재 위치로 본다.
        // 페이지 끝에 닿으면 마지막 제목이 상단까지 올라오지 못하므로 마지막 제목을 고른다.
        let frame = 0;
        const update = () => {
            frame = 0;
            if (!headers.length) return;
            const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
            let current = headers[0];
            for (const h of headers) {
                if (h.getBoundingClientRect().top - ACTIVE_OFFSET <= 1) current = h;
                else break;
            }
            setActiveId(atBottom ? headers[headers.length - 1].id : current.id);
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return [toc, activeId];
}
