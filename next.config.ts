import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모노레포가 아니므로 프로젝트 루트를 명시 (상위 폴더 lockfile 경고 방지)
  turbopack: { root: process.cwd() },
  // next dev 가 AGENTS.md/CLAUDE.md 를 자동 생성하지 않도록
  agentRules: false,
  images: {
    // 한국관광공사 이미지 서버만 next/image 최적화 대상으로 허용
    remotePatterns: [
      { protocol: "http", hostname: "tong.visitkorea.or.kr" },
      { protocol: "https", hostname: "tong.visitkorea.or.kr" },
      // KOPIS 공연 포스터
      { protocol: "http", hostname: "www.kopis.or.kr" },
      { protocol: "https", hostname: "www.kopis.or.kr" },
      { protocol: "http", hostname: "kopis.or.kr" },
      { protocol: "https", hostname: "kopis.or.kr" },
    ],
  },
};

export default nextConfig;
