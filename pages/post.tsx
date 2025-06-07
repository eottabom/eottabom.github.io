import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import { GetStaticProps } from 'next';
import { getPostsMetaOnly } from '../lib/posts';

type Post = {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  tags?: string[];
};

type Props = {
  postsByTag: Record<string, Post[]>;
  tagCounts: Record<string, number>;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = getPostsMetaOnly();

  const postsByTag: Record<string, Post[]> = {};
  const tagCounts: Record<string, number> = {};

  postsByTag['latest'] = posts.slice(0, 10);
  tagCounts['latest'] = postsByTag['latest'].length;

  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      if (!postsByTag[tag]) postsByTag[tag] = [];
      postsByTag[tag].push(post);
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return {
    props: {
      postsByTag,
      tagCounts,
    },
  };
};

export default function PostPage({ postsByTag, tagCounts }) {
  const [selectedTag, setSelectedTag] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(10);
  const [gradientStyle, setGradientStyle] = useState("");

  const posts = postsByTag[selectedTag] || [];
  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  const title = selectedTag === "latest"
    ? "Latest Posts"
    : `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} Posts`;

  const description = selectedTag === "latest"
    ? "Showing the 10 most recent posts. You can filter by tag."
    : `Posts related to the '${selectedTag}' category.`;

  const gradientOptions = [
    "from-yellow-400 to-pink-500",
    "from-green-400 to-blue-500",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-red-500",
    "from-sky-400 to-cyan-600",
    "from-orange-400 to-rose-500",
    "from-teal-400 to-emerald-500",
    "from-violet-500 to-fuchsia-500",
  ];

  useEffect(() => {
    if (selectedTag !== "latest") {
      const random = gradientOptions[Math.floor(Math.random() * gradientOptions.length)];
      setGradientStyle(`bg-gradient-to-r ${random}`);
    }
  }, [selectedTag]);

  const tagList = [
    "latest",
    ...Object.keys(tagCounts).filter(tag => tag !== "latest").sort((a, b) => a.localeCompare(b)),
  ];

  return (
    <main>
      {/* 상단 영역만 배경색 적용 */}
      <div className={`${selectedTag !== 'latest' ? gradientStyle : 'bg-white'} ${selectedTag !== 'latest' ? 'text-white' : 'text-black'}`}>
        <Header isDark={selectedTag !== 'latest'} />
        {/* PostSection */}
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className={`text-5xl font-extrabold tracking-tight mb-4 ${selectedTag === "latest" ? "text-gray-900" : "text-white"}`}>
            {title}
          </h1>
          <p className={`text-lg ${selectedTag === "latest" ? "text-gray-500" : "text-white"}`}>
            {description}
          </p>
        </div>
      </div>

      {/* Tag 필터 탭 */}
      <div className="tag-section py-4 px-4 sm:px-6 lg:px-8 bg-white">
        <nav className="flex justify-center flex-wrap gap-4 mb-12">
          {tagList.map(tag => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(tag);
                setVisibleCount(10);
              }}
              className={`capitalize px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                selectedTag === tag
                  ? "bg-black text-white"
                  : "bg-gray-100 text-black border-gray-300"
              }`}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)} ({tagCounts[tag]})
            </button>
          ))}
        </nav>
      </div>

      {/* 카드 리스트 영역 */}
      <div className="card-section max-w-6xl mx-auto px-4 pb-16 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {visiblePosts.map(({ id, title, summary, description }) => (
            <Link key={id} href={`/post/${id}`} legacyBehavior>
              <a className="group flex flex-col justify-between p-6 min-h-[200px] rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-gray-50 transition duration-200 ease-in-out">
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold leading-snug text-gray-900 group-hover:text-blue-600 transition">
                    {title}
                  </h2>
                  {summary && <p className="text-blue-500 text-sm font-medium">{summary}</p>}
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{description}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {/* 더 보기 버튼 */}
        {hasMore && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="px-6 py-2 text-sm font-medium rounded-full bg-black text-white hover:bg-gray-800 transition"
            >
              더 보기
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
