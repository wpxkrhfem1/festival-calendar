import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모노레포가 아니므로 프로젝트 루트를 명시 (상위 폴더 lockfile 경고 방지)
  turbopack: { root: process.cwd() },
  // next dev 가 AGENTS.md/CLAUDE.md 를 자동 생성하지 않도록
  agentRules: false,
  images: {
    /**
     * 이미지 변환 횟수를 줄이기 위한 설정.
     *
     * 데이터에 들어 있는 고유 이미지 URL 이 6,990개다(축제 사진 + 공연 포스터).
     * Vercel Hobby 의 이미지 최적화 한도는 월 5,000회이고, 변환은
     * (원본 URL × 너비 × 품질) 조합마다 1회씩 센다. 기본값을 그대로 두면
     * 너비 후보가 16가지라 한 장에 여러 번 변환될 수 있다.
     *
     * 그래서 실제로 쓰는 sizes 에 맞는 너비만 남기고, 품질은 하나로 고정했다.
     * 화면에서 쓰는 sizes: 100vw / 50vw / 33vw / 25vw / 112~144px 고정폭.
     */
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [128, 256, 384],
    qualities: [75],
    // 한 번 만든 변환본을 오래 들고 있게 한다 (31일)
    minimumCacheTTL: 2678400,
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
