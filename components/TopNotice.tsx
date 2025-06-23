import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TopNotice() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const dismissed = localStorage.getItem('topNoticeDismissed');
        if (dismissed) setVisible(false);
    }, []);

    const dismiss = () => {
        setVisible(false);
        localStorage.setItem('topNoticeDismissed', 'true');
    };

    if (!visible) return null;

    return (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-800 px-4 py-3 text-sm flex justify-between items-center">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span>⚙️ 이 블로그는 현재 작업 중입니다.</span>
                <Link
                    href="https://github.com/eottabom/eottabom.github.io/tree/maintenance/master/_posts"
                    target="_blank"
                    className="underline hover:text-blue-600"
                >
                    기존 Post GitHub 에서 확인하기
                </Link>
            </div>
            <button onClick={dismiss} className="ml-4 text-blue-500 hover:text-blue-700">
                ✕
            </button>
        </div>
    );
}
