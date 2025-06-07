import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GetStaticProps } from 'next';
import {getPostsMetaOnly} from '../lib/posts';
import AdSense from '../components/AdSense';
import TopNotice from "../components/TopNotice";

const gradients = [
  'from-pink-500 via-red-500 to-orange-400',
  'from-blue-400 to-green-400',
  'from-purple-500 to-pink-500',
  'from-yellow-400 via-green-500 to-teal-500',
  'from-indigo-500 to-sky-500',
  'from-rose-400 via-fuchsia-500 to-indigo-500',
  'from-emerald-400 to-lime-500',
];

type Post = {
  id: string;
  title: string;
  summary?: string;
  description?: string;
};

type HomeProps = {
  allPostsData: Post[];
  gradientsForPosts: string[];
};

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const allPostsData = getPostsMetaOnly();
  const [latest, ...restAll] = allPostsData;

  const rest = restAll.filter((post) => post.id !== latest.id).slice(0, 3);

  const gradientsForPosts = shuffle(gradients).slice(0, rest.length);

  return {
    props: {
      allPostsData,
      gradientsForPosts,
    },
  };
};

export default function Home({ allPostsData, gradientsForPosts }: HomeProps) {
  const [latest, ...restAll] = allPostsData;
  const rest = restAll.filter((post) => post.id !== latest.id).slice(0, 3);

  return (
    <>
      <TopNotice />
      <div className="min-h-screen">
        <Header isDark={false} />

        {/* Hero Section */}
        <section className="text-center pt-40 pb-28 px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">Hi, I’m a <strong>considerate developer</strong>.</h1>
          <p className="text-lg text-gray-600 leading-loose space-y-2">
            I believe being considerate means writing <strong>clean, readable code</strong>,<br />
            building <strong>predictable and testable systems</strong>,<br />
            and delivering <strong>reliable, trustworthy services</strong> that users can depend on.<br /><br />
            I’m constantly <strong>learning and growing</strong> to become better at this,<br />
            and this blog is where I share my <strong>journey as a learning developer</strong>.
          </p>
        </section>


        <div className="bg-gray-50 pt-32 pb-20 px-4">
          <main className="max-w-4xl mx-auto px-4 pb-32 space-y-24">
            {/* Latest Post */}
            <section>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-500 uppercase tracking-wide">
                Latest Post
              </span>

              <h2 className="mt-4 text-4xl font-extrabold text-gray-900">
                {latest.title}
              </h2>

              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                {latest.summary || 'No summary provided.'}
              </p>

              {latest.description && (
                <p className="mt-2 text-base text-gray-500 leading-relaxed">
                  {latest.description}
                </p>
              )}

              <Link
                href={`/post/${latest.id}`}
                className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition"
              >
                Continue Reading →
              </Link>
            </section>

            <AdSense />

            {/* More Posts */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white text-gray-500 uppercase tracking-wide">
                  More Posts
                </span>
                <Link
                  href="/post"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  Read all →
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {rest.map(({ id, title }, idx) => (
                  <Link key={id} href={`/post/${id}`}>
                    <div
                      className={`flex flex-col justify-end p-6 h-48 sm:h-64 rounded-xl text-white shadow hover:shadow-xl transition bg-gradient-to-br ${gradientsForPosts[idx]}`}
                    >
                      <h3 className="text-lg font-semibold leading-snug">{title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
