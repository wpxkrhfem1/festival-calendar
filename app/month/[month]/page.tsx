import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFestivalsByMonth } from "@/lib/festivals";
import { todayKST } from "@/lib/date";
import { monthPageTitle, SITE_NAME } from "@/lib/site";
import FestivalList from "@/components/FestivalList";

// 하루 1회 재검증 (ISR). 오늘 날짜에 따라 연도 해석이 바뀌므로 필요
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
  const { year, festivals } = getFestivalsByMonth(month, todayKST());
  const top = festivals.slice(0, 3).map((f) => f.title).join(", ");
  const description = festivals.length
    ? `${year}년 ${month}월 전국 축제 ${festivals.length}개. ${top} 등 지역별·카테고리별로 한눈에 확인하세요.`
    : `${year}년 ${month}월 전국 축제 일정을 달별로 정리했어요.`;
  return {
    title: { absolute: monthPageTitle(month, year) },
    description,
    alternates: { canonical: `/month/${month}` },
    openGraph: { title: monthPageTitle(month, year), description, siteName: SITE_NAME, type: "website" },
  };
}

/** 월별 축제 리스트 페이지 */
export default async function MonthPage({ params }: PageProps<"/month/[month]">) {
  const { month: raw } = await params;
  const month = parseMonth(raw);
  if (!month) notFound();

  const today = todayKST();
  const { year, festivals } = getFestivalsByMonth(month, today);

  return (
    <div>
      <div className="mb-4 pt-2">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-300">{year}년</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{month}월 축제</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {month}월에 열리거나 이어지는 전국 축제 {festivals.length}개
        </p>
      </div>
      <FestivalList festivals={festivals} today={today} emptyMessage={`${month}월에는 아직 등록된 축제가 없어요`} />
    </div>
  );
}
