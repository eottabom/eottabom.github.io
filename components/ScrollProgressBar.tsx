import { useEffect, useState } from 'react';

export default function ScrollProgressBar() {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (scrollTop / docHeight) * 100;
            setScrollProgress(scrolled);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="absolute left-0 bottom-0 w-full h-1 z-10 bg-transparent pointer-events-none">
            <div
                className="h-full bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 transition-all duration-150"
                style={{ width: `${scrollProgress}%` }}
            />
        </div>
    );
}
