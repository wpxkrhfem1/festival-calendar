import type { NextConfig } from "next";

/**
 * 완전 정적 사이트로 내보낸다 (GitHub Pages 배포).
 *
 * 원래 Vercel 에 올렸는데 Hobby 한도를 넘어 프로젝트가 통째로 멈췄다
 * (HTTP 402 / DEPLOYMENT_DISABLED). 빌드 결과를 보면 3,642 페이지 중
 * 서버가 필요한 건 9개 라우트와 이미지 최적화뿐이었다. 데이터가 저장소의
 * JSON 이고 매일 커밋으로 갱신되는 구조라 애초에 서버가 할 일이 없다.
 *
 * 그래서 서버 의존을 전부 걷어내고 HTML 을 통째로 구워 GitHub Pages 에 올린다.
 * 대역폭 무제한, 무료, 한도에 걸릴 자원 자체가 없다.
 */
const nextConfig: NextConfig = {
  output: "export",

  // 저장소 이름이 경로에 붙는다: https://wpxkrhfem1.github.io/festival-calendar/
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",

  // GitHub Pages 는 /path/ 를 /path/index.html 로 찾는다
  trailingSlash: true,

  turbopack: { root: process.cwd() },
  agentRules: false,

  images: {
    /**
     * 이미지 최적화를 쓰지 않는다.
     *
     * 고유 이미지 URL 이 7,000개에 가까운데 Vercel Hobby 의 변환 한도는
     * 월 5,000회였다. 한도를 먹은 주범으로 의심되는 자리다.
     * 원본을 한국관광공사·KOPIS 서버에서 그대로 불러오면 변환도, 우리 대역폭도 0이다.
     * 정적 내보내기에서는 어차피 최적화 서버를 띄울 수 없다.
     */
    unoptimized: true,
  },
};

export default nextConfig;
