import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFestivalsByMonth, pickMonthYear } from "@/lib/festivals";
import { todayKST } from "@/lib/date";
import { monthPageTitle, SITE_NAME } from "@/lib/site";
import MonthYearTabs from "@/components/MonthYearTabs";

// 하루 1회 재검증 (ISR). 오늘 날짜에 따라 기본 연도가 바뀌므로 필요
export const revalidate = 86400;
// 1~12 외의 경로는 404
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 12 }, (_, i) => ({ month: String(i + 1) }));
}

function parseMonth(raw: string): number | null {
  const m = Number(raw);
  return Number.isInteger(m) && m >= 1 && m <= 12 ? m : null;
}

/**
 * 이 페이지가 기본으로 여는 연·월이 이미 지났는지.
 *
 * 지금(2026년 9월) /month/5 는 2026년 5월을 보여주는데 143건 중 114건이
 * 이미 끝난 축제다. "5월 축제 총정리" 로 검색해 들어온 사람이 갈 수 있는
 * 곳이 거의 없다. 그래서 지난 달은 색인 대상에서 뺀다.
 *
 * 2027년 일정이 쌓이면 getFestivalsByMonth 의 기본 연도가 알아서 넘어가고,
 * 이 함수도 false 를 돌려주므로 색인이 자동으로 되살아난다.
 */
function isPastMonth(month: number, year: number, today: string): boolean {
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));
  return year < nowYear || (year === nowYear && month < nowMonth);
}

export async function generateMetadata({ params }: PageProps<"/month/[month]">): Promise<Metadata> {
  const { month: raw } = await params;
  const month = parseMonth(raw);
  if (!month) return {};
  const result = getFestivalsByMonth(month, todayKST());
  const chosen = pickMonthYear(result, result.defaultYear);
  const festivals = chosen?.festivals ?? [];
  const today = todayKST();
  const past = isPastMonth(month, result.defaultYear, today);
  // 아직 안 끝난 것만 세야 설명이 사실과 맞는다
  const live = festivals.filter((f) => f.endDate >= today);
  const top = (past ? festivals : live).slice(0, 3).map((f) => f.title).join(", ");
  const description = past
    ? `${result.defaultYear}년 ${month}월에 열렸던 전국 축제 ${festivals.length}개. ${top} 등 다음 해 일정을 가늠하는 데 참고하세요.`
    : live.length
      ? `${result.defaultYear}년 ${month}월 전국 축제 ${live.length}개. ${top} 등 지역별·카테고리별로 한눈에 확인하세요.`
      : `${result.defaultYear}년 ${month}월 전국 축제 일정을 달별로 정리했어요.`;
  return {
    title: { absolute: monthPageTitle(month, result.defaultYear) },
    description,
    ...(past ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `/month/${month}` },
    openGraph: { title: monthPageTitle(month, result.defaultYear), description, siteName: SITE_NAME, type: "website" },
  };
}

/** 월별 축제 리스트 페이지 */
export default async function MonthPage({ params }: PageProps<"/month/[month]">) {
  const { month: raw } = await params;
  const month = parseMonth(raw);
  if (!month) notFound();

  const today = todayKST();
  const result = getFestivalsByMonth(month, today);
  const total = result.years.reduce((n, y) => n + y.festivals.length, 0);
  // 화면 요약에는 아직 갈 수 있는 수를 쓴다. 전체 건수만 적으면 이미 끝난 축제까지 센 수가 된다
  const liveCount = result.years.reduce((n, y) => n + y.festivals.filter((f) => f.endDate >= today).length, 0);

  return (
    <div>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{month}월 축제</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {result.years.length > 1
            ? `${result.years.map((y) => `${y.year}년 ${y.festivals.length}개`).join(" · ")} — 연도를 골라 보세요`
            : liveCount > 0
              ? `${month}월에 열리거나 이어지는 축제 중 아직 갈 수 있는 ${liveCount}개`
              : `${month}월 축제 ${total}개 — 올해 일정은 모두 끝났어요`}
        </p>
      </div>
      <MonthYearTabs
        month={month}
        today={today}
        defaultYear={result.defaultYear}
        years={result.years.map((y) => ({ year: y.year, count: y.festivals.length, past: y.past, festivals: y.festivals }))}
      />
    </div>
  );
}
