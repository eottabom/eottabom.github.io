import { useEffect, useState } from 'react';

// 글 상세 오른쪽 열 맨 아래에 두는 세로형 멀티플렉스 광고. 높이가 화면보다 길어서(약 1200px) 고정 목차 안에는 넣지 않는다.
// 목차는 넓은 화면(lg, 1024px 이상)에서만 보이므로 광고 칸도 그때만 만든다.
// 숨겨진 칸에 push 하면 AdSense 가 폭 0 오류를 내고, 페이지의 다른 광고 push 와도 섞이지 않도록 자기 칸만 직접 채운다.

const WIDE_SCREEN = '(min-width: 1024px)';

export default function SidebarMultiplexAd() {
    const [isWide, setIsWide] = useState(false);

    useEffect(() => {
        setIsWide(window.matchMedia(WIDE_SCREEN).matches);
    }, []);

    useEffect(() => {
        if (!isWide) {
            return;
        }
        try {
            const w = window as unknown as { adsbygoogle?: unknown[] };
            (w.adsbygoogle = w.adsbygoogle || []).push({});
        } catch (e) {
            console.error('Adsbygoogle push error:', e);
        }
    }, [isWide]);

    if (!isWide) {
        return null;
    }

    return (
        <div>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-format="autorelaxed"
                data-ad-client="ca-pub-5103032140213770"
                data-ad-slot="7339400430"
            />
        </div>
    );
}
