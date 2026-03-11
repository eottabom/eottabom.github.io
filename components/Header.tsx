import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, FileText, BookOpen, Bookmark, FlaskConical, Wrench, User, type LucideIcon } from "lucide-react";
import ScrollProgressBar from "./ScrollProgressBar";
import TranslateButton from "./TranslateButton";

export default function Header() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [labOpen, setLabOpen] = useState(false);
    const showProgressBar = Boolean(pathname && pathname.startsWith("/post/") && pathname !== "/post/");

    useEffect(() => {
        setOpen(false);
        setLabOpen(false);
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const items: { href: string; label: string; icon: LucideIcon; newTab?: boolean }[] = [
        { href: "/", label: "Home", icon: Home },
        { href: "/post", label: "Posts", icon: FileText },
        { href: "/book", label: "Books", icon: BookOpen },
        { href: "/link", label: "Read/Keep", icon: Bookmark },
        { href: "/about", label: "About", icon: User },
    ];
    const labItems: { href: string; label: string; icon: LucideIcon }[] = [
        { href: "/toolkit", label: "Toolkit", icon: Wrench },
        { href: "/playground/", label: "Playground", icon: FlaskConical },
    ];

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname?.startsWith(href);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm relative">
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
                    {items.map((it) => {
                        const Icon = it.icon;
                        return (
                        <Link
                            key={it.href}
                            href={it.href}
                            {...(it.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                            className={`
                                px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5
                                ${isActive(it.href)
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-800"
                                }
                            `}
                            aria-current={isActive(it.href) ? "page" : undefined}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {it.label}
                        </Link>
                        );
                    })}
                    <div
                        className="relative py-2 -my-2"
                        onMouseEnter={() => setLabOpen(true)}
                        onMouseLeave={() => setLabOpen(false)}
                    >
                        <button
                            type="button"
                            onClick={() => setLabOpen((value) => !value)}
                            className={`
                                px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5
                                ${labOpen ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}
                            `}
                            aria-expanded={labOpen}
                            aria-haspopup="menu"
                        >
                            <FlaskConical className="w-3.5 h-3.5" />
                            Lab
                        </button>
                        {labOpen && (
                            <div className="absolute right-0 top-full pt-2 w-44">
                                <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                                {labItems.map((it) => {
                                    const Icon = it.icon;
                                    return (
                                        <a
                                            key={it.href}
                                            href={it.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {it.label}
                                        </a>
                                    );
                                })}
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Translate button (desktop) */}
                <div className="hidden md:block">
                    <TranslateButton />
                </div>

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
                        {items.map((it) => {
                            const Icon = it.icon;
                            return (
                            <Link
                                key={it.href}
                                href={it.href}
                                {...(it.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className={`
                                    px-4 py-3 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-2
                                    ${isActive(it.href)
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                    }
                                `}
                                aria-current={isActive(it.href) ? "page" : undefined}
                            >
                                <Icon className="w-4 h-4" />
                                {it.label}
                            </Link>
                            );
                        })}
                        <div className="rounded-xl bg-gray-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-[15px] font-semibold text-gray-900">
                                <FlaskConical className="w-4 h-4" />
                                Lab
                            </div>
                            <div className="mt-2 flex flex-col gap-1">
                                {labItems.map((it) => {
                                    const Icon = it.icon;
                                    return (
                                        <a
                                            key={it.href}
                                            href={it.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-white hover:text-gray-900"
                                        >
                                            <Icon className="w-4 h-4" />
                                            {it.label}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="px-4 py-3">
                            <TranslateButton />
                        </div>
                    </nav>
                </div>
            )}
            {showProgressBar && <ScrollProgressBar />}
        </header>
    );
}
