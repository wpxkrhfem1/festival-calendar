"use client";

import { useState } from "react";
import { buildIcs, icsFileName, type EventInput } from "@/lib/ics";

interface Props {
  /** 담을 일정. 서버에서 만들어 넘긴다 (상세 페이지는 정적이라 빌드 때 구워진다) */
  events: EventInput[];
  /** 내려받을 파일 이름의 바탕 */
  fileBase: string;
  label?: string;
  /** 찜 목록처럼 큰 버튼으로 쓸 때 */
  wide?: boolean;
}

/**
 * 캘린더에 담기.
 *
 * 찜은 사이트를 다시 열어야 기억나지만, 캘린더에 넣으면 하루 전에 기기가 알려준다.
 *
 * 전에는 서버 라우트(/ics)가 파일을 만들어 줬는데, 사이트를 완전 정적으로
 * 내보내면서 서버가 없어졌다. 그래서 브라우저에서 만들어 Blob 으로 내려받는다.
 * .ics 는 순수 텍스트라 만드는 데 서버가 필요하지 않다.
 */
export default function CalendarButton({ events, fileBase, label = "캘린더에 담기", wide }: Props) {
  const [failed, setFailed] = useState(false);

  function download() {
    try {
      const blob = new Blob([buildIcs(events)], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = icsFileName(fileBase);
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 넉넉히 기다린 뒤 해제한다. 바로 풀면 사파리에서 내려받기가 끊긴다
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 2500);
    }
  }

  const icon = (
    <svg
      width={wide ? 18 : 17}
      height={wide ? 18 : 17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4M12 12.5v5M9.5 15h5" />
    </svg>
  );

  if (wide) {
    return (
      <button
        type="button"
        onClick={download}
        className="mb-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-bold text-white transition hover:bg-brand-600"
      >
        {icon}
        {failed ? "내려받지 못했어요" : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={download}
      aria-label={`${fileBase} 캘린더에 담기`}
      className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
    >
      {icon}
      {failed ? "내려받지 못했어요" : label}
    </button>
  );
}
