import type { Metadata } from "next";
import { searchFestivals } from "@/lib/festivals";
import { searchConcerts } from "@/lib/concerts";
import { todayKST } from "@/lib/date";
import FestivalCard from "@/components/FestivalCard";
import ConcertCard from "@/components/ConcertCard";
import EmptyState from "@/components/EmptyState";
import SearchForm from "@/components/SearchForm";

export const metadata: Metadata = {
  title: "축제·공연 검색",
  description: "축제명, 공연명, 지역, 출연진으로 전국 축제와 공연을 검색해 보세요.",
  robots: { index: false }, // 검색 결과 페이지는 색인 제외
};

const MAX_PER_SECTION = 24;

/** 검색 페이지: /search?q= — 축제와 공연을 구역별로 나눠 보여준다 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const q = (raw ?? "").trim().slice(0, 50);
  const today = todayKST();

  const festivals = q ? searchFestivals(q) : [];
  const concerts = q ? searchConcerts(q) : [];
  const total = festivals.length + concerts.length;

  return (
    <div>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">검색</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          축제와 공연을 함께 찾아요. 축제명, 공연명, 지역, 출연진으로 검색할 수 있어요.
        </p>
      </div>
      <SearchForm defaultValue={q} />

      {q && (
        <p className="mb-4 mt-6 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
          &ldquo;{q}&rdquo; 검색 결과 축제 {festivals.length}개 · 공연 {concerts.length}개
        </p>
      )}

      {q && total === 0 && (
        <EmptyState title="검색 결과가 없어요" description="다른 키워드로 찾아보거나, 월별 달력에서 둘러보세요." showHome />
      )}

      {festivals.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">
            축제 <span className="text-sm font-normal text-zinc-500">{festivals.length}개</span>
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {festivals.slice(0, MAX_PER_SECTION).map((f) => (
              <li key={f.id}>
                <FestivalCard festival={f} today={today} />
              </li>
            ))}
          </ul>
          {festivals.length > MAX_PER_SECTION && (
            <p className="mt-3 text-sm text-zinc-500">앞의 {MAX_PER_SECTION}개만 보여드려요. 검색어를 좁혀보세요.</p>
          )}
        </section>
      )}

      {concerts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">
            공연 <span className="text-sm font-normal text-zinc-500">{concerts.length}개</span>
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {concerts.slice(0, MAX_PER_SECTION).map((c) => (
              <li key={c.id}>
                <ConcertCard concert={c} today={today} />
              </li>
            ))}
          </ul>
          {concerts.length > MAX_PER_SECTION && (
            <p className="mt-3 text-sm text-zinc-500">앞의 {MAX_PER_SECTION}개만 보여드려요. 검색어를 좁혀보세요.</p>
          )}
        </section>
      )}
    </div>
  );
}
