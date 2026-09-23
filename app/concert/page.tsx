import type { Metadata } from "next";
import Link from "next/link";
import { getAllConcerts, getConcertMonthSummaries } from "@/lib/concerts";
import { overlaps, parseDate, todayKST, whenRange, type WhenKey } from "@/lib/date";
import { SITE_NAME } from "@/lib/site";
import BrowseBar from "@/components/BrowseBar";
import GenreShortcuts from "@/components/GenreShortcuts";
import ConcertCollage from "@/components/ConcertCollage";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "전국 공연·콘서트 달력",
  description:
    "콘서트, 뮤지컬, 연극, 클래식까지 전국 공연을 월별로 모았어요. 출연진과 예매처 링크까지 한눈에 확인하세요.",
  alternates: { canonical: "/concert" },
};

/** 공연 홈: 12개월 카드 그리드 */
export default function ConcertHomePage() {
  const today = todayKST();
  const { month: nowMonth, year: nowYear } = parseDate(today);
  const months = getConcertMonthSummaries(today);

  // 바로가기에 붙일 건수
  const all = getAllConcerts();
  const upcoming = all.filter((c) => c.endDate >= today);
  const genreCount = new Map<string, number>();
  for (const c of upcoming) if (c.genre) genreCount.set(c.genre, (genreCount.get(c.genre) ?? 0) + 1);
  const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1]);
  const whenCounts = Object.fromEntries(
    (["ongoing", "weekend", "thisMonth"] as WhenKey[]).map((k) => {
      const range = whenRange(k, today);
      return [k, all.filter((c) => overlaps(c.startDate, c.endDate, range)).length];
    }),
  ) as Partial<Record<WhenKey, number>>;

  return (
    <div>
      <section className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {nowYear}년 {nowMonth}월, 어떤 공연 볼까?
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
          {/* 끝난 공연까지 센 수를 적으면 들어갔을 때와 어긋난다 (축제 홈과 같은 규칙) */}
          지금 볼 수 있는 전국 공연 {upcoming.length.toLocaleString()}개를 달별로 모았어요. 시기·지역·장르로 바로 찾아보세요.
        </p>
      </section>

      <div className="mb-6">
        <BrowseBar
          action="/concert/browse"
          accent="violet"
          submitLabel="공연 찾기"
          third={{ name: "genre", placeholder: "장르 전체", options: genres.map(([g]) => g) }}
        />
      </div>

      <GenreShortcuts genres={genres} whenCounts={whenCounts} />

      <h2 className="mb-3 text-base font-bold">월별로 둘러보기</h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {months.map(({ month, year, count, otherYears, sample }) => {
          const isNow = month === nowMonth;
          return (
            <li key={month}>
              <Link
                href={`/concert/month/${month}`}
                aria-label={`${year}년 ${month}월 공연 ${count}개 보기`}
                className={`group block overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900 ${
                  isNow ? "border-violet-600 ring-2 ring-violet-600/40" : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
                  <ConcertCollage sample={sample} />
                  {isNow && (
                    <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                      이번 달
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between p-3">
                  <div>
                    <h2 className="text-lg font-extrabold group-hover:text-violet-600 dark:group-hover:text-violet-300">{month}월</h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{year}년</p>
                  </div>
                  <p className="text-right text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {count > 0 ? `공연 ${count}개` : "등록 예정"}
                    {otherYears.length > 0 && (
                      <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                        {otherYears.map((o) => `${o.year}년 ${o.count}개`).join(" · ")}
                      </span>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-400">
        공연 정보 출처: 예술경영지원센터 공연예술통합전산망(KOPIS). {SITE_NAME}
      </p>
    </div>
  );
}
