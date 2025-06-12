import {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType
} from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { getAllPostIds, getPostData } from '../../lib/posts';
import Header from '../../components/Header';
import Panel from '../../components/Panel';
import { BlueText, RedText, GreenText } from '../../components/Highlight';
import { useTocObserver } from '../../hooks/useTocObserver';
import ScrollProgressBar from '../../components/ScrollProgressBar';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { List } from 'lucide-react';
import { ArrowDownCircle } from 'lucide-react';
import { Tabs, Tab } from "../../components/Tabs";

type PostData = {
  id: string;
  title: string;
  date: string;
  mdxSource: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostIds();
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<{ postData: PostData }> = async ({ params }) => {
  const postData = await getPostData(params?.id as string);
  return { props: { postData } };
};

export default function Post({ postData }: InferGetStaticPropsType<typeof getStaticProps>) {
  const [toc, activeId] = useTocObserver();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight > el.clientHeight) {
      setShowScrollHint(true);
    }
  }, [toc]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    setShowScrollHint(!isAtBottom);
  };

  const components = {
    info: (props: any) => <Panel type="info" {...props} />,
    warning: (props: any) => <Panel type="warning" {...props} />,
    danger: (props: any) => <Panel type="danger" {...props} />,
    success: (props: any) => <Panel type="success" {...props} />,
    note: (props: any) => <Panel type="note" {...props} />,
    tip: (props: any) => <Panel type="tip" {...props} />,
    neutral: (props: any) => <Panel type="neutral" {...props} />,
    quote: (props: any) => <Panel type="quote" {...props} />,
    BlueText,
    RedText,
    GreenText,
    Tabs,
    Tab
  };

  return (
      <>
        <ScrollProgressBar />
        <Header isDark={false} />
        <div className="max-w-[90rem] mx-auto px-6 py-20 flex gap-16">
          {/* Main content */}
          <main className="flex-1 max-w-3xl prose prose-xl mr-[17rem]">
            <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>
            <p className="text-gray-500 text-sm mb-8">{postData.date}</p>
            <article>
              <MDXRemote {...postData.mdxSource} components={components}/>
            </article>
          </main>

          {/* Table of contents */}
          <aside
              className="hidden lg:block fixed right-10 top-[96px] w-60 h-[calc(100vh-96px)] pl-4 z-40 pb-[120px]"
          >
            <div className="relative h-full">
              {/* Scrollable 목차 영역 */}
              <div
                  ref={scrollRef}
                  className="overflow-y-auto h-full pr-2 scrollbar-hide"
                  onScroll={handleScroll}
              >
                <h2 className="text-sm font-semibold mb-2">🧾 목차</h2>
                <ul className="space-y-1 text-xs sm:text-sm text-gray-700 pb-12">
                  {toc.map((item) => (
                      <li key={item.id} className={item.level === 3 ? 'ml-4' : ''}>
                        <a
                            href={`#${item.id}`}
                            className={`hover:text-blue-600 hover:underline ${
                                item.id === activeId ? 'text-blue-600 font-semibold' : ''
                            }`}
                        >
                          {item.text}
                        </a>
                      </li>
                  ))}
                </ul>
              </div>

              {/* 스크롤 힌트 */}
              {showScrollHint && (
                  <div
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-2 py-2 rounded-full shadow animate-bounce z-10">
                    <ArrowDownCircle className="w-5 h-5"/>
                  </div>
              )}
            </div>
          </aside>


        </div>
        <Link
            href="/post"
            className="fixed bottom-6 right-6 z-50 bg-white border border-gray-300 rounded-lg shadow-md p-3 hover:shadow-lg transition"
            aria-label="목록으로 가기"
        >
          <List className="w-6 h-6 text-gray-800"/>
        </Link>
      </>
  );
}
