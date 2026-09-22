"use client";

import { useState } from "react";
import type { Concert, Festival } from "@/lib/types";
import RegionMonthTabs from "./RegionMonthTabs";
import ConcertList from "./ConcertList";

interface Props {
  festivals: Festival[];
  concerts: Concert[];
  today: string;
  regionName: string;
}

type Section = "festival" | "concert";

/**
 * 지역 페이지의 축제 / 공연 전환.
 *
 * 축제만 보여주던 때는 세종 2건, 대구 4건처럼 거의 빈 페이지가 나왔다.
 * 같은 지역 공연은 대구 160건, 대전 102건씩 이미 데이터에 있어서
 * 둘을 한 페이지에서 오갈 수 있게 하면 17개 시도가 전부 볼 만해진다.
 *
 * 처음 열 탭은 건수가 많은 쪽으로 정한다. 빈 목록을 먼저 보여주지 않기 위해서다.
 */
export default function RegionSections({ festivals, concerts, today, regionName }: Props) {
  const [section, setSection] = useState<Section>(festivals.length >= concerts.length ? "festival" : "concert");

  const tabs: { key: Section; label: string; count: number }[] = [
    { key: "festival", label: "축제", count: festivals.length },
    { key: "concert", label: "공연", count: concerts.length },
  ];

  return (
    <div>
      <div role="tablist" aria-label="분류 선택" className="mb-4 flex gap-2">
        {tabs.map((t) => {
          const on = section === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setSection(t.key)}
              className={`h-10 flex-1 rounded-xl border text-sm font-bold transition sm:flex-none sm:px-6 ${
                on
                  ? t.key === "festival"
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-violet-600 bg-violet-600 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs font-semibold ${on ? "text-white/80" : "text-zinc-400"}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {section === "festival" ? (
        <RegionMonthTabs festivals={festivals} today={today} regionName={regionName} />
      ) : (
        <ConcertList
          concerts={concerts}
          today={today}
          showRegionFilter={false}
          emptyMessage={`${regionName}에는 아직 등록된 공연이 없어요`}
        />
      )}
    </div>
  );
}
