import Header from "../components/Header";
import ReadAndKeep from "../components/ReadAndKeep";
import type { Article } from "../components/ReadAndKeep";
import data from "../contents/link/data.json";
import {Home} from "lucide-react";
import Link from "next/link";

export default function LinkPage() {
    const articles = (data as Article[]) ?? [];
    return (
        <>
            <div className="bg-white text-black">
                <Header />
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Read &amp; Keep</h1>
                    <p className="mt-2 text-sm text-gray-400">A place to keep articles I found interesting or worth revisiting. Each link opens the original page in a new tab.</p>
                    <p className="mt-1 text-sm text-gray-400">Keywords are added so I can quickly find them later.</p>
                </div>
            </div>
            <main className="mx-auto px-6 pb-20 max-w-5xl xl:max-w-6xl">
                <ReadAndKeep articles={articles} />
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
