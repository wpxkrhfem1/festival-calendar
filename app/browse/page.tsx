import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME } from "@/lib/site";
import BrowseResults from "@/components/BrowseResults";

export const metadata: Metadata = {
  title: "조건으로 축제 찾기",
  description: "시기, 지역, 카테고리를 골라 전국 축제를 찾아보세요.",
  robots: { index: false }, // 조합이 많아 색인 대상에서 제외
};

/**
 * 시기·지역·카테고리 조건으로 찾기.
 *
 * 껍데기만 정적으로 굽고, 주소창의 조건을 읽어 거르는 일은 브라우저가 한다.
 * useSearchParams 를 쓰는 부분은 Suspense 로 감싸야 정적 내보내기가 된다.
 */
export default function BrowsePage() {
  return (
    <>
      <Suspense fallback={<p className="pt-6 text-sm text-zinc-500 dark:text-zinc-400">불러오는 중이에요…</p>}>
        <BrowseResults />
      </Suspense>
      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">데이터 제공: 한국관광공사. {SITE_NAME}</p>
    </>
  );
}
