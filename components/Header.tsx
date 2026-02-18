import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderProps = {
    isDark: boolean;
};

export default function Header({ isDark }: HeaderProps) {
    const pathname = usePathname();

    const items = [
        { href: "/", label: "Main" },
        { href: "/post", label: "Posts" },
        { href: "/book", label: "Book-Reviews" },
        { href: "/link", label: "Useful-Links" },
        { href: "/toolkit", label: "Toolkit" },
        { href: "/about", label: "About" },
    ];

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname?.startsWith(href);

    const base = `${isDark ? "text-white" : "text-black"}`;
    const hover = "hover:text-blue-300";
    const active = "font-extrabold underline underline-offset-4";
    const idle = "font-bold";

    return (
        <header className="flex justify-end items-center px-6 py-4">
            <nav className="flex gap-6 items-center" aria-label="Main Navigation">
                {items.map((it) => {
                    const activeCls = isActive(it.href) ? active : idle;
                    return (
                        <Link
                            key={it.href}
                            href={it.href}
                            className={`${base} ${hover} ${activeCls} focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-md px-1`}
                            aria-current={isActive(it.href) ? "page" : undefined}
                        >
                            {it.label}
                        </Link>
                    );
                })}
                {/* <ThemeToggle /> */}
            </nav>
        </header>
    );
}
