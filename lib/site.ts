/** 사이트 공통 상수 (SEO/메타데이터) */

export const SITE_NAME = "전국축제자랑";
export const SITE_TAGLINE = "이번 달 전국 축제 한눈에";
export const SITE_DESCRIPTION =
  "대한민국 전국 축제·페스티벌을 1월부터 12월까지 달별로 모아 보여드려요. 이번 달 어디서 뭐 하는지 5초 만에 확인하세요.";

/** 배포 도메인. NEXT_PUBLIC_SITE_URL 이 없으면 로컬 주소 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** 월 페이지 title: "10월 축제 총정리 | 전국축제자랑 2026" */
export function monthPageTitle(month: number, year: number): string {
  return `${month}월 축제 총정리 | ${SITE_NAME} ${year}`;
}

export const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
