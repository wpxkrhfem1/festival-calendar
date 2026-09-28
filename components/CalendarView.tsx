"use client";

import { useState } from "react";
import type { FestivalCardData } from "@/lib/card";
import { addMonths, formatKoreanDate, isLongRunning, monthGrid, openOn } from "@/lib/date";
import FestivalCard from "./FestivalCard";
import EmptyState from "./EmptyState";

interface Props {
  festivals: FestivalCardData[];
  today: string;
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
/** 앞으로 몇 달까지 넘겨볼 수 있게 할지. 데이터가 내년 말까지라 넉넉히 둔다 */
const MONTHS_AHEAD = 11;

/**
 * 칸 색의 진하기. 그 달에서 가장 많은 날을 기준으로 나눈다.
 * 처음엔 "15개 이상이면 진하게" 로 고정했는데, 가을엔 하루 16~53개라
 * 모든 칸이 똑같이 진해져서 어느 날이 붐비는지 보이지 않았다.
 */
function shade(n: number, max: number): string {
  if (n === 0 || max === 0) return "";
  const r = n / max;
  if (r < 0.5) return "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200";
  if (r < 0.8) return "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100";
  return "bg-brand-500 text-white dark:bg-brand-500";
}

/**
 * 날짜 칸 달력.
 *
 * 칸마다 그날 열려 있는 축제 수를 적고, 날짜를 누르면 아래에 그날 축제가 나온다.
 * 120일 넘게 이어지는 연중 상설 행사는 수에서 뺐다. 이게 들어가면 모든 칸에
 * 똑같이 10여 개가 얹혀서 어느 날이 붐비는지 보이지 않는다.
 * 상설은 목록 맨 아래에 접어 둔다.
 */
export default function CalendarView({ festivals, today }: Props) {
  const thisMonth = today.slice(0, 7);
  const lastMonth = addMonths(thisMonth, MONTHS_AHEAD);
  const [ym, setYm] = useState(thisMonth);
  const [selected, setSelected] = useState(today);
  const [showLong, setShowLong] = useState(false);

  const [year, month] = ym.split("-").map(Number);
  const weeks = monthGrid(year, month);

  const seasonal = festivals.filter((f) => !isLongRunning(f.startDate, f.endDate));
  const countOn = (iso: string) => openOn(seasonal, iso).length;
  const monthMax = Math.max(0, ...weeks.flat().filter((d): d is string => !!d).map(countOn));

  const dayList = openOn(festivals, selected);
  const daySeasonal = dayList
    .filter((f) => !isLongRunning(f.startDate, f.endDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate));
  const dayLong = dayList.filter((f) => isLongRunning(f.startDate, f.endDate));
  const startsThatDay = daySeasonal.filter((f) => f.startDate === selected).length;

  function go(delta: number) {
    const next = addMonths(ym, delta);
    if (next < thisMonth || next > lastMonth) return;
    setYm(next);
    // 이번 달로 돌아오면 오늘을, 다른 달이면 그달 1일을 고른다
    setSelected(next === thisMonth ? today : `${next}-01`);
    setShowLong(false);
  }

  return (
    <div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={ym <= thisMonth}
            aria-label="이전 달"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold tracking-tight" aria-live="polite">
            {year}년 {month}월
          </h2>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={ym >= lastMonth}
            aria-label="다음 달"
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEK.map((w, i) => (
            <div
              key={w}
              className={`pb-1 text-xs font-semibold ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              {w}
            </div>
          ))}
          {weeks.flat().map((iso, i) => {
            if (!iso) return <div key={`blank-${i}`} aria-hidden />;
            const n = countOn(iso);
            const dow = i % 7;
            const isToday = iso === today;
            const isSel = iso === selected;
            const past = iso < today;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setSelected(iso);
                  setShowLong(false);
                }}
                aria-pressed={isSel}
                aria-label={`${formatKoreanDate(iso)}, 축제 ${n}개`}
                className={`flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border text-sm transition sm:aspect-auto sm:h-16 ${
                  isSel
                    ? "border-brand-500 ring-2 ring-brand-500/40"
                    : isToday
                      ? "border-brand-300 dark:border-brand-700"
                      : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                } ${past ? "opacity-45" : ""}`}
              >
                <span
                  className={`font-semibold ${dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : ""}`}
                >
                  {Number(iso.slice(8, 10))}
                </span>
                {n > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] font-bold leading-4 sm:text-[11px] ${shade(n, monthMax)}`}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          숫자는 그날 열려 있는 축제 수예요. 색이 진할수록 이 달에서 축제가 많은 날이에요. 1년 내내 하는 상설 행사는 세지 않았어요.
        </p>
      </div>

      <section className="mt-6" aria-live="polite">
        <h2 className="text-lg font-bold">
          {formatKoreanDate(selected)}
          <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            열리는 축제 {daySeasonal.length}개{startsThatDay > 0 ? ` · 이날 시작 ${startsThatDay}개` : ""}
          </span>
        </h2>

        {daySeasonal.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="이날 열리는 축제가 없어요"
              description="다른 날짜를 눌러 보세요. 숫자가 진할수록 축제가 많은 날이에요."
            />
          </div>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {daySeasonal.map((f) => (
              <li key={f.id}>
                <FestivalCard festival={f} today={today} />
              </li>
            ))}
          </ul>
        )}

        {dayLong.length > 0 && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowLong((v) => !v)}
              className="text-sm text-zinc-500 underline underline-offset-2 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-300"
            >
              {showLong ? `연중 상설 ${dayLong.length}개 접기` : `연중 상설 ${dayLong.length}개도 보기`}
            </button>
            {showLong && (
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {dayLong.map((f) => (
                  <li key={f.id}>
                    <FestivalCard festival={f} today={today} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
