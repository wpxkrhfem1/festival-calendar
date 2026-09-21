import type { Metadata } from "next";
import Link from "next/link";
import { getMonthSummaries } from "@/lib/festivals";
import { todayKST, parseDate } from "@/lib/date";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import MonthCollage from "@/components/MonthCollage";
import ScrollToCurrentMonth from "@/components/ScrollToCurrentMonth";

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

  return (
    <div>
      <ScrollToCurrentMonth month={nowMonth} />
      <section className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {nowYear}년 {nowMonth}월, 어디서 뭐 하지?
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 sm:text-base">
          전국 축제를 달별로 모았어요. 달을 고르면 지역·카테고리로 바로 걸러볼 수 있어요.
        </p>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {months.map(({ month, year, count, otherYears, images, sample }) => {
          const isNow = month === nowMonth;
          return (
            <li key={month} id={`month-${month}`} className="scroll-mt-32">
              <Link
                href={`/month/${month}`}
                aria-label={`${year}년 ${month}월 축제 ${count}개 보기`}
                className={`group block overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900 ${
                  isNow
                    ? "border-brand-500 ring-2 ring-brand-500/40"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                {/* 대표 이미지 콜라주 (최대 4장) */}
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
                  <MonthCollage images={images} sample={sample} />
                  {isNow && (
                    <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-bold text-white shadow">
                      이번 달
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between p-3">
                  <div>
                    <h2 className="text-lg font-extrabold group-hover:text-brand-600 dark:group-hover:text-brand-300">{month}월</h2>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{year}년</p>
                  </div>
                  <p className="text-right text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {count > 0 ? `축제 ${count}개` : "등록 예정"}
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
    </div>
  );
}
