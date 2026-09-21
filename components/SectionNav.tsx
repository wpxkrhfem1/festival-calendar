"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 최상단 축제/공연 전환.
 * 두 데이터는 출처도 성격도 달라 목록을 섞지 않고 구역으로 나눈다.
 */
export default function SectionNav() {
  const pathname = usePathname();
  const isConcert = pathname.startsWith("/concert");

  const base = "flex h-8 items-center rounded-full px-3 text-sm font-bold transition";
  return (
    <nav aria-label="구역 선택" className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
      <Link
        href="/"
        aria-current={!isConcert ? "page" : undefined}
        className={`${base} ${!isConcert ? "bg-brand-500 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"}`}
      >
        축제
      </Link>
      <Link
        href="/concert"
        aria-current={isConcert ? "page" : undefined}
        className={`${base} ${isConcert ? "bg-violet-600 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"}`}
      >
        공연
      </Link>
    </nav>
  );
}
