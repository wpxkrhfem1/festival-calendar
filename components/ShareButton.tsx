"use client";

import { useState } from "react";

interface Props {
  title: string;
  /** 공유 문구에 붙일 한 줄 (기간·장소 등) */
  text?: string;
}

/**
 * 공유 버튼.
 *
 * 모바일에서는 기기 공유창이 열려 카카오톡으로 바로 보낼 수 있다 (Web Share API).
 * 그게 없는 환경(대부분 데스크톱)에서는 주소를 복사한다.
 *
 * 카카오 SDK 를 붙이면 링크 미리보기를 우리가 직접 꾸밀 수 있지만
 * 앱 키 발급이 필요해서, 우선 키 없이 되는 방식으로 뒀다.
 */
export default function ShareButton({ title, text }: Props) {
  const [done, setDone] = useState<"" | "copied" | "failed">("");

  async function share() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    const payload = { title, text: text ? `${title} · ${text}` : title, url };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        // 사용자가 공유창을 닫은 것뿐이면 아무것도 하지 않는다
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setDone("copied");
    } catch {
      setDone("failed");
    }
    setTimeout(() => setDone(""), 2000);
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`${title} 공유하기`}
      className="flex h-11 items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {done === "copied" ? "주소 복사됨" : done === "failed" ? "복사 실패" : "공유"}
    </button>
  );
}
