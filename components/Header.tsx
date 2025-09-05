import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

type HeaderProps = {
  isDark: boolean;
};

export default function Header({ isDark }: { isDark: boolean }) {
  return (
    <header className="flex justify-end items-center px-6 py-4">
      <div className="flex gap-6 items-center">
        <Link href="/" className={`${isDark ? "text-white" : "text-black"} hover:text-blue-300`}>
          <span className="font-bold">Main</span>
        </Link>
        <Link href="/post" className={`${isDark ? "text-white" : "text-black"} hover:text-blue-300 font-bold`}>
          Post
        </Link>
        <Link href="/book" className={`${isDark ? "text-white" : "text-black"} hover:text-blue-300 font-bold`}>
          Book-Review
        </Link>
        <Link href="/about" className={`${isDark ? "text-white" : "text-black"} hover:text-blue-300 font-bold`}>
          About
        </Link>
        {/*<ThemeToggle />*/}
      </div>
    </header>
  );
}
