import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="description" content="Real Estate Management System" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        <Main />
        {/* <EnvScript /> removed */}
        <NextScript />
      </body>
    </Html>
  );
}
