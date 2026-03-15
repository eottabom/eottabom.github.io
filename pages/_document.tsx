import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="color-scheme" content="light" />
        {/* Google tag (gtag.js) - 로컬에서는 비활성화 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                var s = document.createElement('script');
                s.async = true;
                s.src = 'https://www.googletagmanager.com/gtag/js?id=G-C4G71YP1XT';
                document.head.appendChild(s);
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-C4G71YP1XT');
              }
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
              description: 'Java, Spring, gRPC, Kubernetes, Clean Code 등 백엔드 개발 경험과 기술을 공유하는 개발자 블로그',
              inLanguage: 'ko',
              author: {
                '@type': 'Person',
                name: 'Eottabom',
                url: 'https://eottabom.github.io/about/',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://eottabom.github.io/post/?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
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
