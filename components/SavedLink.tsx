"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getSavedServerSnapshot, getSavedSnapshot, savedCount, subscribeSaved } from "@/lib/saved";

/** 헤더의 찜 목록 링크. 찜한 개수를 점으로 알려준다 */
export default function SavedLink() {
  const saved = useSyncExternalStore(subscribeSaved, getSavedSnapshot, getSavedServerSnapshot);
  const n = savedCount(saved);

  return (
    <Link
      href="/saved"
      // 모든 화면에 있는 링크라 미리 받아두면 그 무게가 어디서나 따라온다.
      // 찜 목록은 눌러서 들어가는 곳이지 미리 준비해 둘 화면이 아니다.
      prefetch={false}
      aria-label={n > 0 ? `찜 목록 ${n}개` : "찜 목록"}
      className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4l1.4 1.4L12 21.6l7.4-7.2 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" />
      </svg>
      {n > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}
