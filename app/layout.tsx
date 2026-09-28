import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { defaultOgImage } from "@/lib/asset";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 이번 달 전국 축제 한눈에`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    // 확장자가 붙은 정적 이미지. 이름에 .png 가 없으면 GitHub Pages 가 이미지로 안 내보낸다
    images: [{ url: defaultOgImage(SITE_URL), width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: [defaultOgImage(SITE_URL)] },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** 첫 페인트 전에 다크모드 클래스를 적용해 깜빡임을 막는 스크립트 */
const themeInitScript = `
(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Pretendard — 한국어 UI 표준 서체. 이게 없으면 윈도우 기본 맑은고딕으로 떨어져 촌스러워진다 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-4 sm:px-6">{children}</main>
        <Footer />
        {/*
          방문 통계 (GoatCounter).

          Vercel Analytics 를 썼다가 GitHub Pages 로 옮기면서 뺐다 — Vercel 전용이라
          여기서는 404 만 났고, 애초에 대시보드에서 켜지 않아 한 건도 쌓이지 않았다.

          GoatCounter 는 정적 사이트에서 스크립트 한 줄로 동작하고, 쿠키를 쓰지 않아
          동의 배너가 필요 없다. 대시보드는 기본이 비공개라 로그인한 사람만 본다.
          data-goatcounter 주소가 곧 수집 엔드포인트다.
        */}
        <script
          data-goatcounter="https://festival-calendar.goatcounter.com/count"
          async
          src="//gc.zgo.at/count.js"
        />
      </body>
    </html>
  );
}
