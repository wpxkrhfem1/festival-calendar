"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { compareForList, matchesWhen, rangeFromParams, todayKST, whenLabel, type WhenKey } from "@/lib/date";
import { regionBySlug } from "@/lib/regions";
import { useSiteIndex } from "@/lib/useIndex";
import BrowseBar from "./BrowseBar";
import ConcertCard from "./ConcertCard";
import EmptyState from "./EmptyState";

const WHEN_KEYS: WhenKey[] = ["all", "ongoing", "startsToday", "weekend", "thisMonth", "nextMonth", "upcoming", "custom"];
const MAX_SHOWN = 60;

/** 조건으로 공연 찾기 (클라이언트). 축제 쪽 BrowseResults 와 같은 구조 */
export default function ConcertBrowseResults() {
  const sp = useSearchParams();
  const { data, loading, failed } = useSiteIndex();

  const whenRaw = sp.get("when") ?? "";
  const when: WhenKey = WHEN_KEYS.includes(whenRaw as WhenKey) ? (whenRaw as WhenKey) : "all";
  const regionSlug = sp.get("region") ?? "";
  const region = regionSlug ? regionBySlug(regionSlug) : undefined;
  const genreRaw = sp.get("genre") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  const today = todayKST();
  const range = rangeFromParams(when, from, to, today);

  // 데이터에 실제로 있는 장르만 고를 수 있게 한다 (건수 많은 순)
  const genreCount = new Map<string, number>();
  for (const c of data.concerts) if (c.genre) genreCount.set(c.genre, (genreCount.get(c.genre) ?? 0) + 1);
  const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  const genre = genres.includes(genreRaw) ? genreRaw : undefined;

  const results = data.concerts
    .filter((c) => matchesWhen(c.startDate, c.endDate, when, range, today))
    .filter((c) => (region ? c.sido === region.name : true))
    .filter((c) => (genre ? c.genre === genre : true))
    // 진행 중 → 예정 → 종료, 상시 공연은 뒤로
    .sort((a, b) => (a.openRun ? 1 : 0) - (b.openRun ? 1 : 0) || compareForList(a, b, today, true));

  const conditions = [whenLabel(when, range), region?.name, genre].filter(Boolean) as string[];

  return (
    <div>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">공연 찾기</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {conditions.length > 0 ? `${conditions.join(" · ")} 조건으로 찾았어요` : "시기, 지역, 장르를 골라보세요"}
        </p>
      </div>

      <BrowseBar
        action="/concert/browse"
        accent="violet"
        submitLabel="공연 찾기"
        third={{ name: "genre", placeholder: "장르 전체", options: genres }}
        when={when}
        region={regionSlug}
        thirdValue={genreRaw}
        from={from}
        to={to}
      />

      {loading ? (
        <p className="mb-3 mt-5 text-sm text-zinc-500 dark:text-zinc-400">공연 목록을 불러오는 중이에요…</p>
      ) : failed ? (
        <EmptyState title="목록을 불러오지 못했어요" description="새로고침하면 다시 시도합니다." showHome />
      ) : (
        <>
          <p className="mb-3 mt-5 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {results.length}개 공연
          </p>

          {results.length === 0 ? (
            <EmptyState title="조건에 맞는 공연이 없어요" description="시기나 지역을 조금 넓혀보세요." showHome />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {results.slice(0, MAX_SHOWN).map((c, i) => (
                <li key={c.id}>
                  <ConcertCard concert={c} today={today} priority={i < 4} />
                </li>
              ))}
            </ul>
          )}

          {results.length > MAX_SHOWN && (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              앞의 {MAX_SHOWN}개만 보여드려요. 조건을 좁히거나{" "}
              <Link href="/concert" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-300">
                월별 달력
              </Link>
              에서 둘러보세요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
