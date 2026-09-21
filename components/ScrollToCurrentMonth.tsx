"use client";

import { useEffect } from "react";

/**
 * 홈 로드 시 현재 달 카드가 화면 중앙에 오도록 스크롤.
 * 서버가 계산한 달과 브라우저의 달이 다를 수 있으므로(자정 전후) 브라우저 기준을 우선한다.
 */
export default function ScrollToCurrentMonth({ month }: { month: number }) {
  useEffect(() => {
    const m = new Date().getMonth() + 1 || month;
    const el = document.getElementById(`month-${m}`);
    if (!el) return;
    const t = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      // 카드 중앙이 뷰포트 중앙에 오도록. 이미 충분히 보이면 스크롤하지 않는다
      const fullyVisible = rect.top >= 120 && rect.bottom <= window.innerHeight;
      if (fullyVisible) return;
      const top = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 100);
    return () => clearTimeout(t);
  }, [month]);
  return null;
}
