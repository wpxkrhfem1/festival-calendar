import Link from "next/link";
import type { Festival } from "@/lib/types";
import MonthCollage from "./MonthCollage";

export interface MonthSummary {
  month: number;
  year: number;
  past: boolean;
  count: number;
  otherYears: { year: number; count: number }[];
  images: string[];
  sample: Festival[];
}

interface Props {
  months: MonthSummary[];
  /** 오늘이 속한 달 (강조용) */
  nowMonth: number;
}

/** 홈의 월 카드 격자 */
export default function MonthGrid({ months, nowMonth }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {months.map(({ month, year, past, count, otherYears, images, sample }) => {
        const isNow = month === nowMonth && !past;
        return (
          <li key={`${year}-${month}`} id={`month-${month}`} className="scroll-mt-32">
            <Link
              href={`/month/${month}`}
              // 홈에 12개가 한꺼번에 놓여 미리 받으면 3MB 가 넘는다.
              // 정적 페이지라 눌렀을 때 받아도 충분히 빠르다.
              prefetch={false}
              aria-label={`${year}년 ${month}월 축제 ${count}개 보기`}
              className={`group block overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900 ${
                isNow ? "border-brand-500 ring-2 ring-brand-500/40" : "border-zinc-200 dark:border-zinc-800"
              } ${past ? "opacity-80" : ""}`}
            >
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
                  <h3 className="text-lg font-extrabold group-hover:text-brand-600 dark:group-hover:text-brand-300">{month}월</h3>
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
  );
}
