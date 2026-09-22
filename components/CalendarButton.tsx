import type { SavedKind } from "@/lib/saved";

interface Props {
  kind: SavedKind;
  id: string;
  title: string;
}

/**
 * 캘린더에 담기.
 *
 * 찜은 사이트를 다시 열어야 기억나지만, 캘린더에 넣으면 하루 전에 기기가 알려준다.
 * 서버 라우트(/ics)가 파일을 내려주므로 클라이언트 자바스크립트가 필요 없다.
 */
export default function CalendarButton({ kind, id, title }: Props) {
  const href = `/ics?${kind === "festival" ? "f" : "c"}=${encodeURIComponent(id)}`;
  return (
    <a
      href={href}
      aria-label={`${title} 캘린더에 담기`}
      className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
        <path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 12.5v5M9.5 15h5" />
      </svg>
      캘린더에 담기
    </a>
  );
}
