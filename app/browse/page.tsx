import type { Metadata } from "next";
import Link from "next/link";
import { getAllFestivals } from "@/lib/festivals";
import { compareForList, overlaps, rangeFromParams, todayKST, whenLabel, type WhenKey } from "@/lib/date";
import { regionBySlug } from "@/lib/regions";
import { CATEGORY_TAGS } from "@/lib/tags";
import type { Tag } from "@/lib/types";
import { SITE_NAME } from "@/lib/site";
import BrowseBar from "@/components/BrowseBar";
import FestivalCard from "@/components/FestivalCard";
import EmptyState from "@/components/EmptyState";

export const metadata: Metadata = {
  title: "조건으로 축제 찾기",
  description: "시기, 지역, 카테고리를 골라 전국 축제를 찾아보세요.",
  robots: { index: false }, // 조합이 많아 색인 대상에서 제외
};

const WHEN_KEYS: WhenKey[] = ["all", "ongoing", "weekend", "thisMonth", "nextMonth", "upcoming", "custom"];

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** 시기·지역·카테고리 조건으로 찾은 결과 */
export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const sp = await searchParams;
  const whenRaw = one(sp.when);
  const when: WhenKey = WHEN_KEYS.includes(whenRaw as WhenKey) ? (whenRaw as WhenKey) : "all";
  const regionSlug = one(sp.region);
  const region = regionSlug ? regionBySlug(regionSlug) : undefined;
  const categoryRaw = one(sp.category);
  const category = CATEGORY_TAGS.includes(categoryRaw as (typeof CATEGORY_TAGS)[number])
    ? (categoryRaw as Tag)
    : undefined;

  const from = one(sp.from);
  const to = one(sp.to);

  const today = todayKST();
  const range = rangeFromParams(when, from, to, today);

  const results = getAllFestivals()
    .filter((f) => overlaps(f.startDate, f.endDate, range))
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
          {results.slice(0, 60).map((f, i) => (
            <li key={f.id}>
              <FestivalCard festival={f} today={today} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}

      {results.length > 60 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          앞의 60개만 보여드려요. 조건을 좁히거나{" "}
          <Link href="/" className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
            월별 달력
          </Link>
          에서 둘러보세요.
        </p>
      )}

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">데이터 제공: 한국관광공사. {SITE_NAME}</p>
    </div>
  );
}
