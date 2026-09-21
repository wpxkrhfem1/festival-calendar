"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

/** 브라우저의 현재 달 (서버 렌더링 시에는 null → 하이드레이션 불일치 방지) */
const subscribeNoop = () => () => {};
const getNowMonth = () => new Date().getMonth() + 1;
const getServerNowMonth = () => null;

/**
 * 1~12월 숫자 탭 (가로 스크롤)
 * - 현재 보고 있는 월 페이지는 브랜드색으로 강조
 * - 오늘이 속한 달은 점(•)으로 표시하고, 마운트 시 그 탭이 보이도록 스크롤
 */
export default function MonthNav() {
  const pathname = usePathname();
  const nowMonth = useSyncExternalStore(subscribeNoop, getNowMonth, getServerNowMonth);
  const activeRef = useRef<HTMLAnchorElement>(null);

  const match = pathname.match(/^\/month\/(\d{1,2})/);
  const activeMonth = match ? Number(match[1]) : null;
  const highlight = activeMonth ?? nowMonth;

  useEffect(() => {
    // 세로 스크롤에 영향을 주지 않도록 가로 스크롤 위치만 직접 계산
    const el = activeRef.current;
    const list = el?.parentElement?.parentElement;
    if (!el || !list) return;
    list.scrollLeft = el.offsetLeft - list.clientWidth / 2 + el.offsetWidth / 2;
  }, [highlight]);

  return (
    <nav aria-label="월별 이동" className="mx-auto w-full max-w-5xl">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const isActive = activeMonth === m;
          const isNow = nowMonth === m;
          return (
            <li key={m} className="shrink-0">
              <Link
                href={`/month/${m}`}
                ref={highlight === m ? activeRef : undefined}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-brand-500 text-white"
                    : isNow
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {m}월
                {isNow && !isActive && (
                  <span aria-label="이번 달" className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
