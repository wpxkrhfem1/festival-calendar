import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME } from "@/lib/site";
import ConcertBrowseResults from "@/components/ConcertBrowseResults";

export const metadata: Metadata = {
  title: "조건으로 공연 찾기",
  description: "시기, 지역, 장르를 골라 전국 공연과 콘서트를 찾아보세요.",
  robots: { index: false }, // 조합이 많아 색인 대상에서 제외
};

/** 시기·지역·장르 조건으로 찾기. 거르는 일은 브라우저가 한다 (축제 쪽과 같은 구조) */
export default function ConcertBrowsePage() {
  return (
    <>
      <Suspense fallback={<p className="pt-6 text-sm text-zinc-500 dark:text-zinc-400">불러오는 중이에요…</p>}>
        <ConcertBrowseResults />
      </Suspense>
      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
        데이터 제공: 예술경영지원센터 공연예술통합전산망(KOPIS). {SITE_NAME}
      </p>
    </>
  );
}
