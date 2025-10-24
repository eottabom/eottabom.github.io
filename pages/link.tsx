import Header from "../components/Header";
import UsefulLinks from "../components/UsefulLinks";
import type { Article } from "../components/UsefulLinks";
import data from "../contents/link/data.json";
import {Home} from "lucide-react";
import Link from "next/link";

export default function LinkPage() {
    const articles = (data as Article[]) ?? [];
    return (
        <>
            <div className="bg-white text-black dark:bg-black dark:text-white">
                <Header isDark={false} />
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <h1 className="text-5xl font-extrabold tracking-tight mb-4">Useful Links</h1>
                </div>
            </div>
            <main className="mx-auto px-6 pb-20 max-w-5xl xl:max-w-6xl">
                <UsefulLinks articles={articles} />
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
