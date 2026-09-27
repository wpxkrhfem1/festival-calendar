import type { Metadata } from "next";
import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";

export const metadata: Metadata = {
  title: "축제·공연 검색",
  description: "축제명, 공연명, 지역, 출연진으로 전국 축제와 공연을 검색해 보세요.",
  robots: { index: false }, // 검색 결과 페이지는 색인 제외
};

/** 검색. 껍데기만 정적으로 굽고, 찾는 일은 브라우저가 한다 */
export default function SearchPage() {
  return (
    <Suspense fallback={<p className="pt-6 text-sm text-zinc-500 dark:text-zinc-400">불러오는 중이에요…</p>}>
      <SearchResults />
    </Suspense>
  );
}
