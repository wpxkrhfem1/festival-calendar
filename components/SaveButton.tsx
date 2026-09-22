"use client";

import { useSyncExternalStore } from "react";
import {
  getSavedServerSnapshot,
  getSavedSnapshot,
  subscribeSaved,
  toggleSaved,
  type SavedKind,
} from "@/lib/saved";

interface Props {
  kind: SavedKind;
  id: string;
  title: string;
  /** card: 카드 위에 겹치는 작은 버튼 · detail: 상세 페이지의 글자 있는 버튼 */
  variant?: "card" | "detail";
}

/**
 * 찜 버튼.
 * 로그인 없이 브라우저에만 저장한다. 카드 위에 겹쳐 놓기 때문에
 * 링크 안에 들어가도 클릭이 새 나가지 않도록 이벤트를 막는다.
 */
export default function SaveButton({ kind, id, title, variant = "card" }: Props) {
  const saved = useSyncExternalStore(subscribeSaved, getSavedSnapshot, getSavedServerSnapshot);
  const on = saved[kind].includes(id);

  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(kind, id);
  }

  const label = `${title} ${on ? "찜 해제" : "찜하기"}`;

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handle}
        aria-pressed={on}
        aria-label={label}
        className={`flex h-11 items-center gap-1.5 rounded-xl border px-4 text-sm font-bold transition ${
          on
            ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
            : "border-zinc-300 bg-white text-zinc-700 hover:border-rose-300 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        }`}
      >
        <Heart filled={on} />
        {on ? "찜함" : "찜하기"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={on}
      aria-label={label}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-zinc-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-rose-500 dark:bg-zinc-900/85 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      <Heart filled={on} />
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "#f43f5e" : "none"}
      stroke={filled ? "#f43f5e" : "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4l1.4 1.4L12 21.6l7.4-7.2 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}
