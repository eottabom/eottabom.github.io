import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import Head from 'next/head';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Eottabom's Lab. - 어느 따뜻한 봄날이 나에게도 오겠지... 공부하는 개발자 기술 블로그</title>
      </Head>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
