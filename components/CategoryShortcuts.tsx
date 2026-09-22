import Link from "next/link";
import { THEMES } from "@/lib/tags";
import IconTile, { TILE } from "./IconTile";
import { WHEN_LABELS, type WhenKey } from "@/lib/date";

/** 시기 바로가기 (자주 쓰는 것만) */
const QUICK_WHEN: WhenKey[] = ["ongoing", "weekend", "thisMonth"];

interface Props {
  /** 카테고리별 축제 수 */
  counts: Record<string, number>;
  /** 시기별 축제 수 */
  whenCounts: Partial<Record<WhenKey, number>>;
}

/**
 * 홈의 찾아보기 바로가기.
 * 조건 조합을 몰라도 한 번에 누를 수 있게 자주 찾는 것들을 앞에 꺼내둔다.
 */
export default function CategoryShortcuts({ counts, whenCounts }: Props) {
  return (
    <section className="mb-8">
      {/* 시기·위치 바로가기 */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Link
          href="/nearby"
          // 목록을 통째로 들고 있는 화면이라 미리 받지 않는다
          prefetch={false}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          내 주변
        </Link>
        {QUICK_WHEN.map((k) => (
          <Link
            key={k}
            href={`/browse?when=${k}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold transition hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-brand-300"
          >
            {k === "ongoing" && <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />}
            {WHEN_LABELS[k]}
            <span className="text-xs font-medium text-zinc-400">{whenCounts[k] ?? 0}</span>
          </Link>
        ))}
        {/* 연휴처럼 날짜를 정해놓고 찾는 사람을 위한 입구 */}
        <Link
          href="/browse?when=custom"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold transition hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-brand-300"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
          날짜 고르기
        </Link>
      </div>

      {/* 카테고리 타일 */}
      <h2 className="mb-3 text-base font-bold">어떤 축제를 찾으세요?</h2>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
        {/* 타일은 색인되는 테마 페이지로 보낸다. /browse 는 noindex 라 검색 유입 경로가 되지 못한다 */}
        {THEMES.map(({ slug, tag: t }) => {
          if (!TILE[t]) return null;
          return (
            <li key={slug}>
              <Link
                href={`/theme/${slug}`}
                className="group flex flex-col items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white p-2 text-center transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-3"
              >
                <IconTile name={t} />
                <span className="text-[11px] font-bold leading-tight sm:text-xs">{t}</span>
                <span className="text-[10px] text-zinc-400 sm:text-[11px]">{counts[t] ?? 0}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
