import type { Metadata } from "next";
import Link from "next/link";
import { getAllConcerts, getAvailableGenres } from "@/lib/concerts";
import { isLongRunning, overlaps, statusOf, todayKST, WHEN_LABELS, whenRange, type WhenKey } from "@/lib/date";
import { regionBySlug } from "@/lib/regions";
import { SITE_NAME } from "@/lib/site";
import BrowseBar from "@/components/BrowseBar";
import ConcertCard from "@/components/ConcertCard";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "조건으로 공연 찾기",
  description: "시기, 지역, 장르를 골라 전국 공연과 콘서트를 찾아보세요.",
  robots: { index: false }, // 조합이 많아 색인 대상에서 제외
};

const WHEN_KEYS: WhenKey[] = ["all", "ongoing", "weekend", "thisMonth", "nextMonth", "upcoming"];

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** 시기·지역·장르 조건으로 찾은 공연 */
export default async function ConcertBrowsePage({ searchParams }: PageProps<"/concert/browse">) {
  const sp = await searchParams;
  const whenRaw = one(sp.when);
  const when: WhenKey = WHEN_KEYS.includes(whenRaw as WhenKey) ? (whenRaw as WhenKey) : "all";
  const regionSlug = one(sp.region);
  const region = regionSlug ? regionBySlug(regionSlug) : undefined;
  const genres = getAvailableGenres();
  const genreRaw = one(sp.genre);
  const genre = genres.includes(genreRaw) ? genreRaw : undefined;

  const today = todayKST();
  const range = whenRange(when, today);

  const results = getAllConcerts()
    .filter((c) => overlaps(c.startDate, c.endDate, range))
    .filter((c) => (region ? c.sido === region.name : true))
    .filter((c) => (genre ? c.genre === genre : true))
    .sort((a, b) => {
      // 상시 공연은 뒤로, 그 앞은 진행 중 → 예정 순
      const longRun = (c: typeof a) => (c.openRun || isLongRunning(c.startDate, c.endDate) ? 1 : 0);
      const rank = (s: string) => (s === "ongoing" ? 0 : s === "upcoming" ? 1 : 2);
      return (
        longRun(a) - longRun(b) ||
        rank(statusOf(a.startDate, a.endDate, today)) - rank(statusOf(b.startDate, b.endDate, today)) ||
        a.startDate.localeCompare(b.startDate)
      );
    });

  const conditions = [when !== "all" ? WHEN_LABELS[when] : null, region?.name, genre].filter(Boolean) as string[];

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
      />

      <p className="mb-3 mt-5 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        {results.length}개 공연
      </p>

      {results.length === 0 ? (
        <EmptyState title="조건에 맞는 공연이 없어요" description="시기나 지역을 조금 넓혀보세요." showHome />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {results.slice(0, 60).map((c, i) => (
            <li key={c.id}>
              <ConcertCard concert={c} today={today} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}

      {results.length > 60 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          앞의 60개만 보여드려요. 조건을 좁히거나{" "}
          <Link href="/concert" className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-300">
            월별 달력
          </Link>
          에서 둘러보세요.
        </p>
      )}

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
        공연 정보 출처: 예술경영지원센터 공연예술통합전산망(KOPIS). {SITE_NAME}
      </p>
    </div>
  );
}
