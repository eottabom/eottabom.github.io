import { GetStaticProps } from 'next';
import Header from '../components/Header';
import Seo from '../components/Seo';
import BookCard from '../components/BookCard';
import { getBooksMetaOnly, BookMeta } from '../lib/books';
import { Home } from "lucide-react";
import Link from "next/link";

export default function BooksPage({ books }: { books: BookMeta[] }) {
    return (
        <>
            <Seo
              title="Book Reviews"
              description="개발 서적 리뷰 및 독서 기록 - 소프트웨어 개발, 리더십, 설계 관련 책 정리와 인사이트"
            />
            <div className="bg-white text-black">
                <Header />
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Book Reviews</h1>
                    <p className="mt-2 text-sm text-gray-400">A space where I review and reflect on the books I have read.</p>
                </div>
            </div>

            <main className="mx-auto px-6 pb-20 max-w-5xl xl:max-w-6xl">
                {books.length === 0 ? (
                    <p className="text-zinc-500">아직 등록된 리뷰가 없습니다.</p>
                ) : (
                    <div className="space-y-6">
                        {books.map((b) => (
                            <BookCard key={b.slug} meta={b} />
                        ))}
                    </div>
                )}
            </main>
            <Link
                href="/"
                className="fixed bottom-6 right-6 z-50 bg-white border border-gray-300 rounded-lg shadow-md p-3 hover:shadow-lg transition"
                aria-label="홈으로 가기"
            >
                <Home className="w-6 h-6 text-gray-800"/>
            </Link>
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    const books = getBooksMetaOnly();
    return { props: { books } };
};
