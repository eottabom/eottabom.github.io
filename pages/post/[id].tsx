import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { getAllPostIds, getPostData } from '../../lib/posts';
import Header from '../../components/Header';
import Panel from '../../components/Panel';
import { BlueText, RedText, GreenText } from '../../components/Highlight';
import {useTocObserver} from '../../hooks/useTocObserver';

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

  console.log(activeId)

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
  };

  return (
      <>
        <Header isDark={false} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20 flex">
          {/* Main content */}
          <main className="flex-1 prose prose-xl max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">{postData.title}</h1>
            <p className="text-gray-500 text-sm mb-8">{postData.date}</p>
            <article>
              <MDXRemote {...postData.mdxSource} components={components} />
            </article>
          </main>

          {/* Table of contents */}
          <aside className="hidden lg:block w-48 pl-6">
            <div className="sticky top-24 text-sm leading-relaxed space-y-2">
              <h2 className="text-lg font-bold mb-3">📑 목차</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                {toc.map((item) => (
                    <li key={item.id}>
                      <a
                          href={`#${item.id}`}
                          className={`hover:text-blue-600 hover:underline ${
                              (item.id !== activeId ? '' : 'text-blue-600 font-bold')
                          }`}
                      >
                        {item.text}
                      </a>
                    </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </>
  );
}
