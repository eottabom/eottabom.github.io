import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const SITE_URL = 'https://eottabom.github.io';

// 정적 export 라 서버 리다이렉트를 쓸 수 없어서, 옮겨진 경로에 이 페이지를 두고 새 경로로 보낸다.
// JS 가 꺼져 있어도 meta refresh 로 이동하고, canonical 은 새 경로를 가리킨다.
export default function RedirectPage({ to }: { to: string }) {
    const router = useRouter();

    useEffect(() => {
        router.replace(`${to}${window.location.search}${window.location.hash}`);
    }, [router, to]);

    return (
        <>
            <Head>
                <title>Redirecting...</title>
                <meta name="robots" content="noindex" />
                <meta httpEquiv="refresh" content={`0; url=${to}`} />
                <link rel="canonical" href={`${SITE_URL}${to}`} />
            </Head>
            <main className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-500">
                <p>
                    페이지가 옮겨졌습니다.{' '}
                    <Link href={to} className="text-blue-600 underline">
                        새 주소로 이동
                    </Link>
                </p>
            </main>
        </>
    );
}
