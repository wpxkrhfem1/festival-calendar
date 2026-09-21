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

export async function generateMetadata({ params }: PageProps<"/month/[month]">): Promise<Metadata> {
  const { month: raw } = await params;
  const month = parseMonth(raw);
  if (!month) return {};
  const result = getFestivalsByMonth(month, todayKST());
  const chosen = pickMonthYear(result, result.defaultYear);
  const festivals = chosen?.festivals ?? [];
  const top = festivals.slice(0, 3).map((f) => f.title).join(", ");
  const description = festivals.length
    ? `${result.defaultYear}년 ${month}월 전국 축제 ${festivals.length}개. ${top} 등 지역별·카테고리별로 한눈에 확인하세요.`
    : `${result.defaultYear}년 ${month}월 전국 축제 일정을 달별로 정리했어요.`;
  return {
    title: { absolute: monthPageTitle(month, result.defaultYear) },
    description,
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

  return (
    <div>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{month}월 축제</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {result.years.length > 1
            ? `${result.years.map((y) => `${y.year}년 ${y.festivals.length}개`).join(" · ")} — 연도를 골라 보세요`
            : `${month}월에 열리거나 이어지는 전국 축제 ${total}개`}
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
