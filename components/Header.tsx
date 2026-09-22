import Link from "next/link";
import Logo from "./Logo";
import MonthNav from "./MonthNav";
import SavedLink from "./SavedLink";
import SectionNav from "./SectionNav";
import ThemeToggle from "./ThemeToggle";

/** 상단 고정 헤더: 로고 · 축제/공연 전환 · 검색 · 다크모드 + 1~12월 탭 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" aria-label="전국축제자랑 홈" className="shrink-0">
          {/* 좁은 화면에서는 아이콘만 남겨 구역 전환 버튼 자리를 확보한다 */}
          <span className="sm:hidden">
            <Logo compact />
          </span>
          <span className="hidden sm:block">
            <Logo />
          </span>
        </Link>
        <SectionNav />
        <div className="flex shrink-0 items-center gap-1">
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
          <SavedLink />
          <ThemeToggle />
        </div>
      </div>
      <MonthNav />
    </header>
  );
}
