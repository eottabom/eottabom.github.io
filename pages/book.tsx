import { GetStaticProps } from 'next';
import Header from '../components/Header';
import BookCard from '../components/BookCard';
import { getBooksMetaOnly, BookMeta } from '../lib/books';

export default function BooksPage({ books }: { books: BookMeta[] }) {
    return (
        <>
            <div className="bg-white text-black dark:bg-black dark:text-white">
                <Header isDark={false} />
                <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight mb-4">Book Reviews</h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                        읽기 좋은 단일 열 카드 레이아웃. 태그/카테고리 없이 리뷰에만 집중합니다.
                    </p>
                </section>
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
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    const books = getBooksMetaOnly();
    return { props: { books } };
};
