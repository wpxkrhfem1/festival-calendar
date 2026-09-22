"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REGIONS } from "@/lib/regions";
import { WHEN_LABELS, type WhenKey } from "@/lib/date";

const WHEN_ORDER: WhenKey[] = ["all", "ongoing", "weekend", "thisMonth", "nextMonth", "upcoming", "custom"];

/** 구역별 강조색. Tailwind 가 클래스를 지우지 않도록 전체 문자열로 적어둔다 */
const ACCENT = {
  brand: {
    focus: "focus:border-brand-500 focus:ring-brand-500/25",
    button: "bg-brand-500 hover:bg-brand-600",
  },
  violet: {
    focus: "focus:border-violet-600 focus:ring-violet-600/25",
    button: "bg-violet-600 hover:bg-violet-700",
  },
} as const;

interface Props {
  /** 결과 페이지 경로 */
  action: string;
  accent: keyof typeof ACCENT;
  /** 세 번째 선택칸 (축제는 카테고리, 공연은 장르) */
  third: { name: string; placeholder: string; options: string[] };
  submitLabel: string;
  /** 초기 선택값 (결과 페이지에서 되돌려줄 때) */
  when?: WhenKey;
  region?: string;
  thirdValue?: string;
  /** 직접 고른 날짜 구간 (when="custom" 일 때) */
  from?: string;
  to?: string;
}

/**
 * 시기 · 지역 · 카테고리(장르)로 찾아보는 바.
 * 축제와 공연이 같은 모양을 쓰되 강조색과 결과 경로만 다르다.
 * 자바스크립트가 꺼져 있어도 폼 제출로 동작한다.
 */
export default function BrowseBar({
  action,
  accent,
  third,
  submitLabel,
  when = "all",
  region = "",
  thirdValue = "",
  from = "",
  to = "",
}: Props) {
  const router = useRouter();
  const [w, setW] = useState<WhenKey>(when);
  const [r, setR] = useState(region);
  const [t, setT] = useState(thirdValue);
  const [f1, setF1] = useState(from);
  const [f2, setF2] = useState(to);
  const a = ACCENT[accent];

  const selectClass = `h-11 w-full appearance-none rounded-xl border border-zinc-300 bg-white pl-9 pr-8 text-sm font-medium outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 ${a.focus}`;
  const dateClass = `h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium outline-none focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 ${a.focus}`;
  const hasAny = w !== "all" || r !== "" || t !== "";

  return (
    <form action={action} method="get" className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="relative block">
          <span className="sr-only">시기</span>
          <CalendarIcon />
          <select name="when" value={w} onChange={(e) => setW(e.target.value as WhenKey)} className={selectClass}>
            {WHEN_ORDER.map((k) => (
              <option key={k} value={k}>
                {WHEN_LABELS[k]}
              </option>
            ))}
          </select>
          <Chevron />
        </label>

        <label className="relative block">
          <span className="sr-only">지역</span>
          <PinIcon />
          <select name="region" value={r} onChange={(e) => setR(e.target.value)} className={selectClass}>
            <option value="">지역 전체</option>
            {REGIONS.map((x) => (
              <option key={x.slug} value={x.slug}>
                {x.name}
              </option>
            ))}
          </select>
          <Chevron />
        </label>

        <label className="relative block">
          <span className="sr-only">{third.placeholder}</span>
          <TagIcon />
          <select name={third.name} value={t} onChange={(e) => setT(e.target.value)} className={selectClass}>
            <option value="">{third.placeholder}</option>
            {third.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Chevron />
        </label>

        <div className="flex gap-2">
          {hasAny && (
            <button
              type="button"
              onClick={() => {
                setW("all");
                setR("");
                setT("");
                setF1("");
                setF2("");
                router.push(action);
              }}
              aria-label="조건 초기화"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-6 text-sm font-bold text-white transition sm:flex-none ${a.button}`}
          >
            {submitLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h13" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/*
        "날짜 직접 고르기" 를 골랐을 때만 펼친다.
        라이브러리 없이 <input type="date"> 를 쓴다. 모바일에서 기기 기본
        날짜 선택창이 그대로 열려서 따로 만드는 것보다 손에 익다.
        고르지 않은 쪽은 빈 값으로 넘어가고 서버가 하루짜리로 해석한다.
      */}
      {w === "custom" && (
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_1fr_2fr]">
          <label className="block">
            <span className="sr-only">시작 날짜</span>
            <input type="date" name="from" value={f1} onChange={(e) => setF1(e.target.value)} className={dateClass} />
          </label>
          <span className="hidden items-center justify-center text-sm text-zinc-400 sm:flex" aria-hidden>
            ~
          </span>
          <label className="block">
            <span className="sr-only">끝 날짜</span>
            <input type="date" name="to" value={f2} onChange={(e) => setF2(e.target.value)} className={dateClass} />
          </label>
          <p className="self-center text-xs text-zinc-500 dark:text-zinc-400">
            고른 기간에 하루라도 걸치는 축제를 찾아요
          </p>
        </div>
      )}
    </form>
  );
}

/* 입력칸 왼쪽 아이콘들 */
function CalendarIcon() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}
function Chevron() {
  return (
    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
