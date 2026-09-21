"use client";

import { useMemo, useState } from "react";
import type { Festival, Tag } from "@/lib/types";
import { CATEGORY_TAGS } from "@/lib/tags";
import { statusOf } from "@/lib/date";
import FestivalCard from "./FestivalCard";
import EmptyState from "./EmptyState";

type SortKey = "start" | "ending";

interface Props {
  festivals: Festival[];
  today: string;
  /** 지역 드롭다운 표시 여부 (지역 페이지에서는 숨김) */
  showRegionFilter?: boolean;
  /** 빈 상태 문구 */
  emptyMessage?: string;
}

/**
 * 필터/정렬 가능한 축제 목록 (클라이언트 컴포넌트)
 * - 지역(시도) 드롭다운, 카테고리 칩 토글, "진행 중만 보기"
 * - 정렬: 시작일 순(기본) / 종료 임박 순
 */
export default function FestivalList({ festivals, today, showRegionFilter = true, emptyMessage }: Props) {
  const [sido, setSido] = useState("");
  const [tags, setTags] = useState<Set<Tag>>(new Set());
  const [ongoingOnly, setOngoingOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("start");

  const sidos = useMemo(
    () => [...new Set(festivals.map((f) => f.sido).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
    [festivals],
  );

  const filtered = useMemo(() => {
    let list = festivals;
    if (sido) list = list.filter((f) => f.sido === sido);
    if (tags.size) list = list.filter((f) => [...tags].every((t) => f.tags.includes(t)));
    if (ongoingOnly) list = list.filter((f) => statusOf(f.startDate, f.endDate, today) === "ongoing");
    const sorted = [...list];
    if (sort === "start") {
      sorted.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate));
    } else {
      // 종료 임박 순: 아직 안 끝난 것 중 종료일이 빠른 순, 끝난 것은 뒤로
      sorted.sort((a, b) => {
        const ea = a.endDate < today ? 1 : 0;
        const eb = b.endDate < today ? 1 : 0;
        return ea - eb || a.endDate.localeCompare(b.endDate);
      });
    }
    return sorted;
  }, [festivals, sido, tags, ongoingOnly, sort, today]);

  function toggleTag(t: Tag) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const hasFilter = sido || tags.size > 0 || ongoingOnly;

  return (
    <div>
      {/* 필터 바 */}
      <div className="sticky top-[6.25rem] z-30 -mx-4 mb-4 border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:static sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-4 sm:dark:bg-zinc-900">
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
            <input type="checkbox" checked={ongoingOnly} onChange={(e) => setOngoingOnly(e.target.checked)} className="accent-brand-500" />
            진행 중만
          </label>
        </div>
        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {CATEGORY_TAGS.map((t) => {
            const on = tags.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                aria-pressed={on}
                className={`h-8 shrink-0 rounded-full border px-3 text-sm font-medium transition ${
                  on
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                }`}
              >
                {t}
              </button>
            );
          })}
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setSido("");
                setTags(new Set());
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
        {filtered.length}개 축제
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title={hasFilter ? "조건에 맞는 축제가 없어요" : (emptyMessage ?? "이 달에는 등록된 축제가 없어요")}
          description={hasFilter ? "필터를 조금 풀어보면 더 많은 축제를 볼 수 있어요." : "데이터는 매주 새로 받아오니 조금 뒤에 다시 확인해 주세요."}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {filtered.map((f, i) => (
            <li key={f.id}>
              <FestivalCard festival={f} today={today} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
