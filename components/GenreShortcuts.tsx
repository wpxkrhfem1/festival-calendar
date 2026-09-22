import Link from "next/link";
import { WHEN_LABELS, type WhenKey } from "@/lib/date";
import IconTile, { SHORT_NAME, TILE } from "./IconTile";

const QUICK_WHEN: WhenKey[] = ["ongoing", "weekend", "thisMonth"];

interface Props {
  /** [장르명, 건수] 건수 많은 순 */
  genres: [string, number][];
  whenCounts: Partial<Record<WhenKey, number>>;
}

/** 공연 홈의 찾아보기 바로가기 */
export default function GenreShortcuts({ genres, whenCounts }: Props) {
  return (
    <section className="mb-8">
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {QUICK_WHEN.map((k) => (
          <Link
            key={k}
            href={`/concert/browse?when=${k}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold transition hover:border-violet-400 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-violet-300"
          >
            {k === "ongoing" && <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />}
            {WHEN_LABELS[k].replace("진행 중", "공연 중")}
            <span className="text-xs font-medium text-zinc-400">{whenCounts[k] ?? 0}</span>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-base font-bold">어떤 공연을 찾으세요?</h2>
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
        {genres.slice(0, 6).map(([g, n]) => {
          if (!TILE[g]) return null;
          return (
            <li key={g}>
              <Link
                href={`/concert/browse?genre=${encodeURIComponent(g)}&when=upcoming`}
                className="group flex flex-col items-center gap-1.5 rounded-2xl border border-zinc-200 bg-white p-2 text-center transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:p-3"
              >
                <IconTile name={g} />
                <span className="text-[11px] font-bold leading-tight sm:text-xs">{SHORT_NAME[g] ?? g}</span>
                <span className="text-[10px] text-zinc-400 sm:text-[11px]">{n}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
