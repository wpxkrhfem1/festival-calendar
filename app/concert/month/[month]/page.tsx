import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getConcertsByMonth, pickConcertMonthYear } from "@/lib/concerts";
import { todayKST } from "@/lib/date";
import { SITE_NAME } from "@/lib/site";
import ConcertMonthYearTabs from "@/components/ConcertMonthYearTabs";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 12 }, (_, i) => ({ month: String(i + 1) }));
}

function parseMonth(raw: string): number | null {
  const m = Number(raw);
  return Number.isInteger(m) && m >= 1 && m <= 12 ? m : null;
}

export async function generateMetadata({ params }: PageProps<"/concert/month/[month]">): Promise<Metadata> {
  const { month: raw } = await params;
  const month = parseMonth(raw);
  if (!month) return {};
  const result = getConcertsByMonth(month, todayKST());
  const concerts = pickConcertMonthYear(result, result.defaultYear)?.concerts ?? [];
  const top = concerts.slice(0, 3).map((c) => c.title).join(", ");
  const title = `${month}월 공연 총정리 | ${SITE_NAME} ${result.defaultYear}`;
  const description = concerts.length
    ? `${result.defaultYear}년 ${month}월 전국 공연 ${concerts.length}개. ${top} 등 장르·지역별로 한눈에 확인하세요.`
    : `${result.defaultYear}년 ${month}월 공연 일정을 정리했어요.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/concert/month/${month}` },
    openGraph: { title, description, siteName: SITE_NAME, type: "website" },
  };
}

/** 월별 공연 리스트 페이지 */
export default async function ConcertMonthPage({ params }: PageProps<"/concert/month/[month]">) {
  const { month: raw } = await params;
  const month = parseMonth(raw);
  if (!month) notFound();

  const today = todayKST();
  const result = getConcertsByMonth(month, today);
  const total = result.years.reduce((n, y) => n + y.concerts.length, 0);

  return (
    <div>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{month}월 공연</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {result.years.length > 1
            ? `${result.years.map((y) => `${y.year}년 ${y.concerts.length}개`).join(" · ")} — 연도를 골라 보세요`
            : `${month}월에 열리거나 이어지는 전국 공연 ${total}개`}
        </p>
      </div>
      <ConcertMonthYearTabs
        month={month}
        today={today}
        defaultYear={result.defaultYear}
        years={result.years.map((y) => ({ year: y.year, count: y.concerts.length, past: y.past, concerts: y.concerts }))}
      />
    </div>
  );
}
