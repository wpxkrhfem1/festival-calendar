"use client";

import { useState } from "react";
import type { Festival } from "@/lib/types";
import FestivalList from "./FestivalList";
import EmptyState from "./EmptyState";

interface YearGroup {
  year: number;
  count: number;
  past: boolean;
  festivals: Festival[];
}

interface Props {
  month: number;
  years: YearGroup[];
  defaultYear: number;
  today: string;
}

/**
 * 월 페이지의 연도 선택 탭.
 * 연도를 섞어 보여주면 "2027년 3월"이라 써놓고 목록은 2026년 것이 대부분이라 헷갈린다.
 * 연도를 명시적으로 고르게 하고, 탭에 연도별 건수를 함께 보여준다.
 */
export default function MonthYearTabs({ month, years, defaultYear, today }: Props) {
  const [selected, setSelected] = useState(defaultYear);
  const current = years.find((y) => y.year === selected) ?? years[0];

  if (!current) {
    return (
      <EmptyState
        title={`${month}월 축제는 아직 등록된 게 없어요`}
        description="데이터는 매주 월요일 새벽에 새로 받아와요. 조금 뒤에 다시 확인해 주세요."
        showHome
      />
    );
  }

  return (
    <div>
      {/* 연도가 하나뿐이면 탭을 숨긴다 */}
      {years.length > 1 && (
        <div role="tablist" aria-label="연도 선택" className="mb-4 flex gap-2">
          {years.map((y) => {
            const on = y.year === selected;
            return (
              <button
                key={y.year}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setSelected(y.year)}
                className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
                  on
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {y.year}년
                <span className={`text-xs font-medium ${on ? "text-white/80" : "text-zinc-400"}`}>{y.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {current.past && (
        <p className="mb-4 rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {current.year}년 {month}월은 이미 지났어요. 대부분 매년 비슷한 시기에 열리니 다음 해 일정을 가늠하는 데 참고하세요.
        </p>
      )}

      <FestivalList
        festivals={current.festivals}
        today={today}
        emptyMessage={`${current.year}년 ${month}월에는 등록된 축제가 없어요`}
      />
    </div>
  );
}
