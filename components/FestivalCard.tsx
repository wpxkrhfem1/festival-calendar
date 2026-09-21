import Link from "next/link";
import type { Festival } from "@/lib/types";
import { dDayLabel, formatPeriod, isLongRunning, statusOf } from "@/lib/date";
import FestivalImage from "./FestivalImage";
import TagChip from "./TagChip";

interface Props {
  festival: Festival;
  /** KST 기준 오늘 (YYYY-MM-DD) — D-day 계산용 */
  today: string;
  priority?: boolean;
}

/** 목록용 축제 카드: 이미지 · 축제명 · 기간(D-day) · 지역 · 태그 */
export default function FestivalCard({ festival: f, today, priority }: Props) {
  const status = statusOf(f.startDate, f.endDate, today);
  // 상설 행사는 "진행 중 · 300일 남음" 같은 표기 대신 "상설"로
  const dday = status === "ongoing" && isLongRunning(f.startDate, f.endDate) ? "상설" : dDayLabel(f.startDate, f.endDate, today);
  const ddayStyle =
    status === "ongoing"
      ? "bg-brand-500 text-white"
      : status === "ended"
        ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
        : "bg-white/90 text-zinc-900 dark:bg-zinc-900/90 dark:text-zinc-100";
  const region = [f.sido, f.sigungu].filter(Boolean).join(" ");
  const categoryTags = f.tags.filter((t) => !["봄", "여름", "가을", "겨울"].includes(t));

  return (
    <Link
      href={`/festival/${f.id}`}
      className={`group flex overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:flex-col ${status === "ended" ? "opacity-70" : ""}`}
    >
      <div className="relative aspect-square w-32 shrink-0 bg-zinc-100 dark:bg-zinc-800 sm:aspect-[4/3] sm:w-full">
        <FestivalImage src={f.thumbnail || f.image} alt={f.title} tags={f.tags} priority={priority} sizes="(max-width: 640px) 128px, (max-width: 1024px) 50vw, 33vw" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold shadow-sm ${ddayStyle}`}>{dday}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-300 sm:text-base">
          {f.title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{formatPeriod(f.startDate, f.endDate)}</p>
        {region && (
          <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {region}
          </p>
        )}
        {categoryTags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {categoryTags.slice(0, 3).map((t) => (
              <TagChip key={t} tag={t} small />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
