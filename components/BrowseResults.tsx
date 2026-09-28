"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { compareForList, matchesWhen, rangeFromParams, todayKST, whenLabel, type WhenKey } from "@/lib/date";
import { regionBySlug } from "@/lib/regions";
import { CATEGORY_TAGS } from "@/lib/tags";
import type { Tag } from "@/lib/types";
import { useSiteIndex } from "@/lib/useIndex";
import BrowseBar from "./BrowseBar";
import FestivalCard from "./FestivalCard";
import EmptyState from "./EmptyState";

const WHEN_KEYS: WhenKey[] = ["all", "ongoing", "startsToday", "weekend", "thisMonth", "nextMonth", "upcoming", "custom"];
const MAX_SHOWN = 60;

/**
 * 조건으로 축제 찾기 (클라이언트).
 *
 * 전에는 서버가 주소창의 조건을 읽어 걸러 줬다. 사이트를 완전 정적으로
 * 내보내면서 그 일을 브라우저가 한다. 목록은 public/data/index.json 에서 받는다.
 */
export default function BrowseResults() {
  const sp = useSearchParams();
  const { data, loading, failed } = useSiteIndex();

  const whenRaw = sp.get("when") ?? "";
  const when: WhenKey = WHEN_KEYS.includes(whenRaw as WhenKey) ? (whenRaw as WhenKey) : "all";
  const regionSlug = sp.get("region") ?? "";
  const region = regionSlug ? regionBySlug(regionSlug) : undefined;
  const categoryRaw = sp.get("category") ?? "";
  const category = CATEGORY_TAGS.includes(categoryRaw as (typeof CATEGORY_TAGS)[number])
    ? (categoryRaw as Tag)
    : undefined;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  const today = todayKST();
  const range = rangeFromParams(when, from, to, today);

  // 745건 거르고 세우는 일이라 매 렌더 계산해도 눈에 띄지 않는다.
  // 직접 useMemo 를 걸면 range 가 매번 새 객체라 React Compiler 가 최적화를 포기한다.
  const results = data.festivals
    .filter((f) => matchesWhen(f.startDate, f.endDate, when, range, today))
    .filter((f) => (region ? f.sido === region.name : true))
    .filter((f) => (category ? f.tags.includes(category) : true))
    // 진행 중 → 예정 → 종료 순 (검색·월 페이지와 같은 규칙)
    .sort((a, b) => compareForList(a, b, today, true));

  const conditions = [whenLabel(when, range), region?.name, category].filter(Boolean) as string[];

  return (
    <div>
      <div className="mb-4 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">축제 찾기</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {conditions.length > 0 ? `${conditions.join(" · ")} 조건으로 찾았어요` : "시기, 지역, 카테고리를 골라보세요"}
        </p>
      </div>

      <BrowseBar
        action="/browse"
        accent="brand"
        submitLabel="축제 찾기"
        third={{ name: "category", placeholder: "카테고리 전체", options: [...CATEGORY_TAGS] }}
        when={when}
        region={regionSlug}
        thirdValue={categoryRaw}
        from={from}
        to={to}
      />

      {loading ? (
        <p className="mb-3 mt-5 text-sm text-zinc-500 dark:text-zinc-400">축제 목록을 불러오는 중이에요…</p>
      ) : failed ? (
        <EmptyState title="목록을 불러오지 못했어요" description="새로고침하면 다시 시도합니다." showHome />
      ) : (
        <>
          <p className="mb-3 mt-5 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {results.length}개 축제
          </p>

          {results.length === 0 ? (
            <EmptyState
              title="조건에 맞는 축제가 없어요"
              description="시기나 지역을 조금 넓혀보면 더 많은 축제를 볼 수 있어요."
              showHome
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {results.slice(0, MAX_SHOWN).map((f, i) => (
                <li key={f.id}>
                  <FestivalCard festival={f} today={today} priority={i < 3} />
                </li>
              ))}
            </ul>
          )}

          {results.length > MAX_SHOWN && (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              앞의 {MAX_SHOWN}개만 보여드려요. 조건을 좁히거나{" "}
              <Link href="/" className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
                월별 달력
              </Link>
              에서 둘러보세요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
