import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col">
            <Seo
                title="404 - Page Not Found"
                description="요청하신 페이지를 찾을 수 없습니다."
            />
            <Header />

            <main className="flex-grow flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-8xl font-extrabold text-gray-200 select-none">404</h1>
                <h2 className="mt-4 text-2xl font-bold text-gray-800">Page Not Found</h2>
                <p className="mt-3 text-gray-500">
                    요청하신 페이지를 찾을 수 없습니다.
                </p>
                <Link
                    href="/"
                    className="mt-8 inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition"
                >
                    홈으로 돌아가기
                </Link>
            </main>

            <Footer />
        </div>
    );
}
