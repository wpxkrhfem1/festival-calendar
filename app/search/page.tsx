import type { Metadata } from "next";
import { searchFestivals } from "@/lib/festivals";
import { todayKST } from "@/lib/date";
import FestivalCard from "@/components/FestivalCard";
import EmptyState from "@/components/EmptyState";
import SearchForm from "@/components/SearchForm";

export const metadata: Metadata = {
  title: "축제 검색",
  description: "축제명이나 지역명으로 전국 축제를 검색해 보세요.",
  robots: { index: false }, // 검색 결과 페이지는 색인 제외
};

/** 검색 페이지: /search?q= (요청 시 렌더링) */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").trim().slice(0, 50);
  const today = todayKST();
  const results = q ? searchFestivals(q) : [];

  return (
    <div>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">축제 검색</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">축제명, 지역명, 태그로 찾을 수 있어요. 예) 불꽃, 강릉, 딸기</p>
      </div>
      <SearchForm defaultValue={q} />

      {q && (
        <p className="mb-3 mt-6 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
          &ldquo;{q}&rdquo; 검색 결과 {results.length}개
        </p>
      )}

      {q && results.length === 0 ? (
        <EmptyState title="검색 결과가 없어요" description="다른 키워드로 찾아보거나, 월별 달력에서 둘러보세요." showHome />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {results.map((f) => (
            <li key={f.id}>
              <FestivalCard festival={f} today={today} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
