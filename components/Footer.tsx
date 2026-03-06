import '@fortawesome/fontawesome-free/css/all.min.css';

const links = [
    { href: 'mailto:snoopy12oyk@gmail.com', icon: 'fas fa-envelope', label: 'Email' },
    { href: 'https://github.com/eottabom', icon: 'fab fa-github', label: 'GitHub', external: true },
    { href: '/feed.xml', icon: 'fas fa-rss', label: 'RSS', external: true },
];

export default function Footer() {
    return (
        <footer className="bg-white text-slate-600 border-t border-slate-200">
            <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                    &copy; 2025 Eottabom&apos;s Lab. All rights reserved.
                </p>

                <div className="flex items-center gap-3">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-slate-100 border border-slate-700 hover:bg-white hover:text-slate-700 hover:border-slate-300 transition"
                            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            aria-label={link.label}
                            title={link.label}
                        >
                            <i className={`${link.icon} text-sm`} aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
}
