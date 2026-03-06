import Head from 'next/head';
import { useRouter } from 'next/router';

const SITE_URL = 'https://eottabom.github.io';
const DEFAULT_TITLE = "Eottabom's Lab.";
const DEFAULT_DESCRIPTION = 'Java, Spring, gRPC, Kubernetes, DDD, Clean Code 등 백엔드 개발 경험과 기술을 공유하는 개발자 블로그';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

type SeoProps = {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
};

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  publishedTime,
  modifiedTime,
  tags,
  jsonLd,
  noindex = false,
}: SeoProps) {
  const router = useRouter();
  const pageTitle = title ? `${title} | ${DEFAULT_TITLE}` : `${DEFAULT_TITLE} - 백엔드 개발자 기술 블로그`;
  const canonical = `${SITE_URL}${router.asPath.split('?')[0]}`;

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={DEFAULT_TITLE} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="ko_KR" />

      {ogType === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {ogType === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {ogType === 'article' && tags?.map((tag) => (
        <meta property="article:tag" content={tag} key={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {Array.isArray(jsonLd)
        ? jsonLd.map((item, idx) => (
            <script
              key={`jsonld-${idx}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
            />
          ))
        : jsonLd && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          )}
    </Head>
  );
}
