import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="color-scheme" content="light" />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-C4G71YP1XT"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-C4G71YP1XT');
            `,
          }}
        />
        <link rel="alternate" type="application/rss+xml" title="Eottabom Blog RSS" href="/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: "Eottabom's Lab.",
              url: 'https://eottabom.github.io',
              description: '공부하는 개발자 기술 블로그',
              author: {
                '@type': 'Person',
                name: 'Eottabom',
              },
            }),
          }}
        />
        {/* 광고 스크립트 삽입 위치 */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5103032140213770"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
