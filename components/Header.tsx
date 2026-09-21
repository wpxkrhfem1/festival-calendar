import Link from "next/link";
import MonthNav from "./MonthNav";
import ThemeToggle from "./ThemeToggle";
import { SITE_NAME } from "@/lib/site";

/** 상단 고정 헤더: 로고 · 검색 · 다크모드 토글 + 1~12월 탭 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span aria-hidden className="text-xl">🎪</span>
          <span className="text-base sm:text-lg">{SITE_NAME}</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="축제 검색"
            className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <MonthNav />
    </header>
  );
}
