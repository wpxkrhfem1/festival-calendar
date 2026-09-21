import type { Tag } from "@/lib/types";

/** 태그별 색상 */
const TAG_STYLE: Record<Tag, string> = {
  "먹거리": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "불꽃/야경": "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  "꽃/자연": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  "문화/전통": "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  "음악/공연": "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  "봄": "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200",
  "여름": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200",
  "가을": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  "겨울": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
};

export default function TagChip({ tag, small }: { tag: Tag; small?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"} ${TAG_STYLE[tag] ?? "bg-zinc-100 text-zinc-700"}`}>
      {tag}
    </span>
  );
}
