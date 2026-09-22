import Link from "next/link";
import type { ConcertCardData } from "@/lib/card";
import { dDayLabel, formatPeriod, isLongRunning, statusOf } from "@/lib/date";
import ConcertPoster from "./ConcertPoster";
import SaveButton from "./SaveButton";

interface Props {
  concert: ConcertCardData;
  /** KST 기준 오늘 (YYYY-MM-DD) */
  today: string;
  priority?: boolean;
}

/** 목록용 공연 카드: 포스터 · 공연명 · 기간(D-day) · 공연장 · 장르 */
export default function ConcertCard({ concert: c, today, priority }: Props) {
  const status = statusOf(c.startDate, c.endDate, today);
  // 오픈런과 장기 공연은 종료일이 멀어 "500일 남음" 같은 표기가 나오므로 상시로 표시한다
  const longRun = c.openRun || isLongRunning(c.startDate, c.endDate);
  const badge = longRun && status === "ongoing" ? "상시 공연" : dDayLabel(c.startDate, c.endDate, today);
  const badgeStyle =
    status === "ongoing"
      ? "bg-violet-600 text-white"
      : status === "ended"
        ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
        : "bg-white/90 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-100";

  return (
    <Link
      href={`/concert/${c.id}`}
      className={`group flex overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:flex-col ${status === "ended" ? "opacity-70" : ""}`}
    >
      <div className="relative aspect-square w-28 shrink-0 bg-zinc-100 dark:bg-zinc-800 sm:aspect-[3/4] sm:w-full">
        <ConcertPoster src={c.poster} alt={c.title} genre={c.genre} priority={priority} sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 25vw" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm ${badgeStyle}`}>{badge}</span>
        <SaveButton kind="concert" id={c.id} title={c.title} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-300">
          {c.title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{formatPeriod(c.startDate, c.endDate)}</p>
        <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">{c.venue}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
          {c.genre && (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
              {c.genre}
            </span>
          )}
          {c.sido && <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{c.sido}</span>}
        </div>
      </div>
    </Link>
  );
}
