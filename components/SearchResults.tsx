"use client";

import { useSearchParams } from "next/navigation";
import { compareForList, todayKST } from "@/lib/date";
import { relaxedTokens, searchIn } from "@/lib/search";
import { useSiteIndex } from "@/lib/useIndex";
import FestivalCard from "./FestivalCard";
import ConcertCard from "./ConcertCard";
import EmptyState from "./EmptyState";
import SearchForm from "./SearchForm";

const MAX_PER_SECTION = 24;

/**
 * 축제·공연 통합 검색 (클라이언트).
 *
 * 서버가 있을 때는 서버가 찾아 HTML 을 만들어 줬다. 완전 정적으로 내보내면서
 * 브라우저가 목록 파일을 받아 직접 찾는다. 검색 규칙(lib/search.ts)은 그대로다.
 */
export default function SearchResults() {
  const sp = useSearchParams();
  const q = (sp.get("q") ?? "").trim().slice(0, 50);
  const { data, loading, failed } = useSiteIndex();
  const today = todayKST();

  const f = q ? searchIn(data.festivals, q, (x) => `${x.title} ${x.sido} ${x.sigungu} ${x.address} ${x.tags.join(" ")}`) : { results: [], relaxed: false };
  const c = q ? searchIn(data.concerts, q, (x) => `${x.title} ${x.venue} ${x.sido} ${x.genre} ${x.cast}`) : { results: [], relaxed: false };
  // 데이터 순서 그대로 두면 첫 화면이 끝난 축제로 찬다
  const festivals = [...f.results].sort((a, b) => compareForList(a, b, today, true));
  const concerts = [...c.results].sort((a, b) => compareForList(a, b, today, true));
  // "가을축제" 로 못 찾아 "가을 축제" 로 다시 찾은 경우를 알려준다
  const relaxedQuery =
    (f.relaxed || c.relaxed) && f.results.length + c.results.length > 0 ? (relaxedTokens(q) ?? []).join(" ") : "";

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

      {q && loading && <p className="mb-4 mt-6 text-sm text-zinc-500 dark:text-zinc-400">찾는 중이에요…</p>}

      {q && failed && (
        <EmptyState title="목록을 불러오지 못했어요" description="새로고침하면 다시 시도합니다." showHome />
      )}

      {q && !loading && !failed && (
        <>
          <p className="mb-4 mt-6 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            &ldquo;{q}&rdquo; 검색 결과 축제 {festivals.length}개 · 공연 {concerts.length}개
          </p>

          {relaxedQuery && (
            <p className="-mt-2 mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              정확히 맞는 결과가 없어 <b className="font-semibold text-zinc-700 dark:text-zinc-200">{relaxedQuery}</b> 로
              넓혀서 찾았어요.
            </p>
          )}

          {total === 0 && (
            <EmptyState
              title="검색 결과가 없어요"
              description="다른 키워드로 찾아보거나, 월별 달력에서 둘러보세요."
              showHome
            />
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
                <p className="mt-3 text-sm text-zinc-500">
                  앞의 {MAX_PER_SECTION}개만 보여드려요. 검색어를 좁혀보세요.
                </p>
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
                <p className="mt-3 text-sm text-zinc-500">
                  앞의 {MAX_PER_SECTION}개만 보여드려요. 검색어를 좁혀보세요.
                </p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
