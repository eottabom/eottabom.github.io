import {
  GetStaticPaths,
  InferGetStaticPropsType
} from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import {getAllPostIds, getPostData, getPostsMetaOnly, PostMeta} from '../../lib/posts';
import Header from '../../components/Header';
import Seo from '../../components/Seo';
import Panel from '../../components/Panel';
import { BlueText, RedText, GreenText } from '../../components/Highlight';
import { useTocObserver } from '../../lib/useTocObserver';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { List } from 'lucide-react';
import { ArrowDownCircle } from 'lucide-react';
import { Tabs, Tab } from "../../components/Tabs";
import { Kbd, KeyCombo, TopShortcut } from "../../components/Keyboard";
import KeyboardVisual from "../../components/KeyboardVisual";
import dynamic from 'next/dynamic';
import G1GCSimulator from '../../components/G1GCSimulator';

const Giscus = dynamic(() => import('../../components/Giscus'), {
  ssr: false,
});
import {serialize} from "next-mdx-remote/serialize";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type PostData = {
  id: string;
  title: string;
  date: string;
  updated?: string;
  tags?: string[];
  summary?: string;
  description?: string;
  mdxSource: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostIds();
  return { paths, fallback: false };
};

export const getStaticProps = async ({ params }: { params: any }) => {
  const postData = await getPostData(params?.id as string);
  const allPosts = getPostsMetaOnly();

  const relatedPosts = allPosts
      .filter(
          (post) =>
              post.id !== postData.id &&
              post.tags?.some((tag) => postData.tags?.includes(tag))
      );

  return {
    props: {
      postData,
      relatedPosts,
    },
  };
};

export default function Post({ postData, relatedPosts }: InferGetStaticPropsType<typeof getStaticProps>) {
  const [toc, activeId] = useTocObserver();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const [visibleRelatedCount, setVisibleRelatedCount] = useState(3);
  const visibleRelatedPosts = relatedPosts.slice(0, visibleRelatedCount);
  const hasMoreRelated = visibleRelatedCount < relatedPosts.length;

  useEffect(() => {
    setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("Adsbygoogle push error:", e);
      }
    }, 500);
  }, []);

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
    Tab,
    Kbd,
    KeyCombo,
    TopShortcut,
    KeyboardVisual,
    G1GCSimulator,
    a: (props: any) => <a {...props} target="_blank" rel="noopener noreferrer" />
  };

  const seoDescription = postData.description || postData.summary || postData.title;

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: postData.title,
    description: seoDescription,
    datePublished: postData.date,
    dateModified: postData.updated || postData.date,
    author: {
      '@type': 'Person',
      name: 'Eottabom',
      url: 'https://eottabom.github.io/about/',
    },
    publisher: {
      '@type': 'Person',
      name: 'Eottabom',
      url: 'https://eottabom.github.io',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://eottabom.github.io/post/${postData.id}/`,
    },
    inLanguage: 'ko',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['article h1', 'article h2', 'article p'],
    },
    ...(postData.tags && { keywords: postData.tags.join(', ') }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://eottabom.github.io/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Posts',
        item: 'https://eottabom.github.io/post/',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: postData.title,
        item: `https://eottabom.github.io/post/${postData.id}/`,
      },
    ],
  };

  return (
      <>
        <Seo
          title={postData.title}
          description={seoDescription}
          ogType="article"
          publishedTime={postData.date}
          modifiedTime={postData.updated}
          tags={postData.tags}
          jsonLd={[blogPostingJsonLd, breadcrumbJsonLd]}
        />
        <Header />
        <div className="max-w-[90rem] mx-auto px-6 py-20 flex gap-16">
          {/* Main content */}
          <main className="flex-1 prose prose-xl max-w-none">
            <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>
            <time dateTime={postData.date} className="text-gray-500 text-sm mb-8 block">{postData.date}</time>
            {postData.tags && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {postData.tags.map((tag) => (
                      <span
                          key={tag}
                          className="px-2 py-1 text-sm font-medium bg-blue-50 text-blue-700 rounded-md"
                      >
                      #{tag}
                      </span>
                  ))}
                </div>
            )}
            <article className="overflow-x-auto">
              <MDXRemote {...postData.mdxSource} components={components}/>
            </article>
            <Giscus />
            {relatedPosts.length > 0 && (
                <div className="mt-20 p-6 border rounded-2xl bg-gray-50 shadow-sm">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                    🏷️ <span>같은 태그의 글 보기</span>
                  </h2>

                  <ul className="space-y-4">
                    {visibleRelatedPosts.map((post) => (
                        <li key={post.id} className="flex flex-col">
                          <Link
                              href={`/post/${post.id}`}
                              className="text-base font-medium text-gray-800 hover:text-blue-600 no-underline transition"
                          >
                            {post.title}
                          </Link>
                          <span className="text-sm text-gray-500">
                            {post.tags?.map((tag) => `#${tag}`).join(' ')}
                          </span>
                        </li>
                    ))}
                  </ul>
                  {/* 더 보기 버튼 */}
                  {hasMoreRelated && (
                      <div className="mt-6 text-center">
                        <button
                            onClick={() => setVisibleRelatedCount((prev) => prev + 3)}
                            className="px-5 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 transition"
                        >
                          더 보기
                        </button>
                      </div>
                  )}
                </div>
            )}
            {/* ads */}
            <div className="mt-10 flex justify-center min-h-[100px]">
              <div style={{width: "100%", maxWidth: "728px", minHeight: "100px"}}>
                <ins
                    className="adsbygoogle"
                    style={{display: "block", width: "100%", minHeight: "100px"}}
                    data-ad-client="ca-pub-5103032140213770"
                    data-ad-slot="3384415421"
                    data-ad-format="autorelaxed"
                ></ins>
              </div>
            </div>
          </main>

          {/* Table of contents */}
          <aside
              className="hidden lg:block sticky top-[72px] w-60 h-[calc(100vh-72px)] pl-4 z-40 pb-[120px]"
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
