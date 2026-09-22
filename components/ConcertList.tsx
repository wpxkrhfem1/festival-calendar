"use client";

import { useMemo, useState } from "react";
import type { ConcertCardData } from "@/lib/card";
import { isLongRunning, statusOf } from "@/lib/date";
import ConcertCard from "./ConcertCard";
import EmptyState from "./EmptyState";

type SortKey = "start" | "ending";

interface Props {
  concerts: ConcertCardData[];
  today: string;
  showRegionFilter?: boolean;
  emptyMessage?: string;
}

/**
 * 필터/정렬 가능한 공연 목록.
 * 축제와 달리 장르가 핵심 축이라 장르 칩을 앞세운다.
 */
export default function ConcertList({ concerts, today, showRegionFilter = true, emptyMessage }: Props) {
  const [sido, setSido] = useState("");
  const [genres, setGenres] = useState<Set<string>>(new Set());
  const [ongoingOnly, setOngoingOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("start");

  const sidos = useMemo(
    () => [...new Set(concerts.map((c) => c.sido).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
    [concerts],
  );

  // 건수 많은 장르부터 보여준다
  const genreList = useMemo(() => {
    const count = new Map<string, number>();
    for (const c of concerts) if (c.genre) count.set(c.genre, (count.get(c.genre) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]);
  }, [concerts]);

  const filtered = useMemo(() => {
    let list = concerts;
    if (sido) list = list.filter((c) => c.sido === sido);
    if (genres.size) list = list.filter((c) => genres.has(c.genre));
    if (ongoingOnly) list = list.filter((c) => statusOf(c.startDate, c.endDate, today) === "ongoing");
    const sorted = [...list];
    if (sort === "start") {
      // 오픈런과 몇 년씩 이어지는 장기 공연은 매달 맨 위를 차지하므로 뒤로 보낸다
      const longRun = (c: ConcertCardData) => (c.openRun || isLongRunning(c.startDate, c.endDate) ? 1 : 0);
      sorted.sort(
        (a, b) => longRun(a) - longRun(b) || a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate),
      );
    } else {
      sorted.sort((a, b) => {
        const ea = a.endDate < today ? 1 : 0;
        const eb = b.endDate < today ? 1 : 0;
        return ea - eb || a.endDate.localeCompare(b.endDate);
      });
    }
    return sorted;
  }, [concerts, sido, genres, ongoingOnly, sort, today]);

  function toggleGenre(g: string) {
    setGenres((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

  const hasFilter = sido || genres.size > 0 || ongoingOnly;

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {showRegionFilter && (
            <select
              value={sido}
              onChange={(e) => setSido(e.target.value)}
              aria-label="지역 선택"
              className="h-9 rounded-full border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">전체 지역</option>
              {sidos.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="정렬"
            className="h-9 rounded-full border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="start">시작일 순</option>
            <option value="ending">종료 임박 순</option>
          </select>
          <label className="flex h-9 cursor-pointer select-none items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
            <input type="checkbox" checked={ongoingOnly} onChange={(e) => setOngoingOnly(e.target.checked)} className="accent-violet-600" />
            공연 중만
          </label>
        </div>
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {genreList.map(([g, n]) => {
            const on = genres.has(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                aria-pressed={on}
                className={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-sm font-medium transition ${
                  on
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-violet-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {g}
                <span className={`text-[11px] ${on ? "text-white/75" : "text-zinc-400"}`}>{n}</span>
              </button>
            );
          })}
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setSido("");
                setGenres(new Set());
                setOngoingOnly(false);
              }}
              className="h-8 shrink-0 rounded-full px-3 text-sm text-zinc-500 underline-offset-2 hover:underline"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        {filtered.length}개 공연
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title={hasFilter ? "조건에 맞는 공연이 없어요" : (emptyMessage ?? "이 달에는 등록된 공연이 없어요")}
          description={hasFilter ? "필터를 조금 풀어보면 더 많은 공연을 볼 수 있어요." : "데이터는 매주 새로 받아오니 조금 뒤에 다시 확인해 주세요."}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((c, i) => (
            <li key={c.id}>
              <ConcertCard concert={c} today={today} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
