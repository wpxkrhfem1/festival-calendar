"use client";

import { useMemo, useState } from "react";
import type { Festival } from "@/lib/types";
import { monthKey, parseDate, targetYearForMonth } from "@/lib/date";
import FestivalList from "./FestivalList";

interface Props {
  festivals: Festival[];
  today: string;
  regionName: string;
}

/**
 * 지역 페이지의 월별 탭. "전체" + 1~12월.
 * 각 월은 오늘 기준 가장 가까운 앞의 해(targetYearForMonth)로 해석한다.
 */
export default function RegionMonthTabs({ festivals, today, regionName }: Props) {
  const { month: nowMonth } = parseDate(today);
  const [selected, setSelected] = useState<number>(0); // 0 = 전체

  const countByMonth = useMemo(() => {
    const map = new Map<number, number>();
    for (let m = 1; m <= 12; m++) {
      const key = monthKey(targetYearForMonth(m, today), m);
      map.set(m, festivals.filter((f) => f.months.includes(key)).length);
    }
    return map;
  }, [festivals, today]);

  const list = useMemo(() => {
    if (selected === 0) return festivals;
    const key = monthKey(targetYearForMonth(selected, today), selected);
    return festivals.filter((f) => f.months.includes(key));
  }, [festivals, selected, today]);

  return (
    <div>
      <div role="tablist" aria-label="월 선택" className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4">
        {[0, ...Array.from({ length: 12 }, (_, i) => i + 1)].map((m) => {
          const on = selected === m;
          const count = m === 0 ? festivals.length : (countByMonth.get(m) ?? 0);
          return (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setSelected(m)}
              className={`h-9 shrink-0 rounded-full border px-3 text-sm font-semibold transition ${
                on
                  ? "border-brand-500 bg-brand-500 text-white"
                  : m === nowMonth
                    ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-200"
                    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {m === 0 ? "전체" : `${m}월`}
              <span className={`ml-1 text-xs ${on ? "text-white/80" : "text-zinc-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>
      <FestivalList
        festivals={list}
        today={today}
        showRegionFilter={false}
        emptyMessage={selected === 0 ? `${regionName}에는 아직 등록된 축제가 없어요` : `${regionName}의 ${selected}월 축제가 아직 없어요`}
      />
    </div>
  );
}
