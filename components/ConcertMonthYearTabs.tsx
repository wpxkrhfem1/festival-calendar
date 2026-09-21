"use client";

import { useState } from "react";
import type { Concert } from "@/lib/types";
import ConcertList from "./ConcertList";
import EmptyState from "./EmptyState";

interface YearGroup {
  year: number;
  count: number;
  past: boolean;
  concerts: Concert[];
}

interface Props {
  month: number;
  years: YearGroup[];
  defaultYear: number;
  today: string;
}

/** 공연 월 페이지의 연도 선택 탭 (축제 쪽과 같은 방식) */
export default function ConcertMonthYearTabs({ month, years, defaultYear, today }: Props) {
  const [selected, setSelected] = useState(defaultYear);
  const current = years.find((y) => y.year === selected) ?? years[0];

  if (!current) {
    return (
      <EmptyState
        title={`${month}월 공연은 아직 등록된 게 없어요`}
        description="데이터는 매주 월요일 새벽에 새로 받아와요."
        showHome
      />
    );
  }

  return (
    <div>
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
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-violet-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
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
          {current.year}년 {month}월은 이미 지났어요. 지난 공연 기록으로 참고하세요.
        </p>
      )}

      <ConcertList
        concerts={current.concerts}
        today={today}
        emptyMessage={`${current.year}년 ${month}월에는 등록된 공연이 없어요`}
      />
    </div>
  );
}
