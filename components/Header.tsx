import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => { setOpen(false); }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const items = [
        { href: "/", label: "Home" },
        { href: "/post", label: "Posts" },
        { href: "/book", label: "Books" },
        { href: "/link", label: "Links" },
        { href: "/toolkit", label: "Toolkit" },
        { href: "/about", label: "About" },
    ];

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname?.startsWith(href);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm">
            <div className="px-6 h-14 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-1.5 group font-mono">
                    <span className="text-green-500 text-sm">&#8250;</span>
                    <span className="text-[15px] font-bold text-gray-800 group-hover:text-blue-600 transition">
                        eottabom
                    </span>
                    <span className="w-[2px] h-4 bg-blue-500 animate-pulse" />
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-0.5 bg-gray-100 rounded-full p-1" aria-label="Main Navigation">
                    {items.map((it) => (
                        <Link
                            key={it.href}
                            href={it.href}
                            className={`
                                px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200
                                ${isActive(it.href)
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-800"
                                }
                            `}
                            aria-current={isActive(it.href) ? "page" : undefined}
                        >
                            {it.label}
                        </Link>
                    ))}
                </nav>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden relative w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-gray-100 transition"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
                    aria-expanded={open}
                >
                    <span className={`block w-[18px] h-[2px] bg-gray-700 rounded-full transition-all duration-300 ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
                    <span className={`block w-[18px] h-[2px] bg-gray-700 rounded-full transition-all duration-300 ${open ? "opacity-0" : ""}`} />
                    <span className={`block w-[18px] h-[2px] bg-gray-700 rounded-full transition-all duration-300 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden fixed inset-0 top-14 bg-white z-40">
                    <nav className="flex flex-col p-4 gap-1" aria-label="Mobile Navigation">
                        {items.map((it) => (
                            <Link
                                key={it.href}
                                href={it.href}
                                className={`
                                    px-4 py-3 rounded-xl text-[15px] font-semibold transition-all
                                    ${isActive(it.href)
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    }
                                `}
                                aria-current={isActive(it.href) ? "page" : undefined}
                            >
                                {it.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}
