import type { Metadata } from "next";
import { getAllFestivals, getMonthSummaries } from "@/lib/festivals";
import { overlaps, parseDate, todayKST, whenRange, type WhenKey } from "@/lib/date";
import { CATEGORY_TAGS } from "@/lib/tags";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import BrowseBar from "@/components/BrowseBar";
import CategoryShortcuts from "@/components/CategoryShortcuts";
import MonthGrid from "@/components/MonthGrid";

// 하루 1회 재검증 (ISR)
export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${SITE_NAME} — 이번 달 전국 축제 한눈에`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/** 홈: 12개월 카드 그리드 */
export default function HomePage() {
  const today = todayKST();
  const { month: nowMonth, year: nowYear } = parseDate(today);
  const months = getMonthSummaries(today);
  const upcomingMonths = months.filter((m) => !m.past);
  const pastMonths = months.filter((m) => m.past);

  // 바로가기에 붙일 건수. 앞으로 열리거나 진행 중인 축제만 센다
  const all = getAllFestivals();
  const upcoming = all.filter((f) => f.endDate >= today);
  // 전체 764건 중 507건이 이미 끝난 축제다. 그 수를 자랑해봐야 들어가면 없다
  const totalCount = upcoming.length;
  const categoryCounts = Object.fromEntries(
    CATEGORY_TAGS.map((t) => [t, upcoming.filter((f) => f.tags.includes(t)).length]),
  );
  const whenCounts = Object.fromEntries(
    (["ongoing", "weekend", "thisMonth"] as WhenKey[]).map((k) => {
      const range = whenRange(k, today);
      return [k, all.filter((f) => overlaps(f.startDate, f.endDate, range)).length];
    }),
  ) as Partial<Record<WhenKey, number>>;

  return (
    <div>
      <section className="mb-5 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {nowYear}년 {nowMonth}월, 어디서 뭐 하지?
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
          지금 갈 수 있는 전국 축제 {totalCount.toLocaleString()}개를 달별로 모았어요. 시기·지역·카테고리로 바로 찾아보세요.
        </p>
      </section>

      <div className="mb-6">
        <BrowseBar
          action="/browse"
          accent="brand"
          submitLabel="축제 찾기"
          third={{ name: "category", placeholder: "카테고리 전체", options: [...CATEGORY_TAGS] }}
        />
      </div>

      <CategoryShortcuts counts={categoryCounts} whenCounts={whenCounts} />

      {/* 다가오는 달을 앞에, 이미 지난 달은 뒤에 따로 묶는다 */}
      <h2 className="mb-3 text-base font-bold">다가오는 축제, 달별로 둘러보기</h2>
      <MonthGrid months={upcomingMonths} nowMonth={nowMonth} />

      {pastMonths.length > 0 && (
        <section className="mt-10">
          <h2 className="text-base font-bold">지난 축제 둘러보기</h2>
          <p className="mb-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            올해 이미 지난 달이에요. 대부분 매년 비슷한 시기에 열리니 다음 해 일정을 가늠하는 데 참고하세요.
          </p>
          <MonthGrid months={pastMonths} nowMonth={nowMonth} />
        </section>
      )}
    </div>
  );
}
