"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface Props {
  photos: string[];
  title: string;
}

/**
 * 축제 사진 갤러리.
 * 가로로 넘겨 보고, 누르면 전체 화면으로 크게 본다.
 * TourAPI 사진은 가로·세로가 섞여 있어 썸네일은 정사각으로 잘라 줄을 맞추고,
 * 크게 볼 때는 잘리지 않게 전체를 보여준다.
 */
export default function PhotoGallery({ photos, title }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (step: number) => setOpen((i) => (i === null ? null : (i + step + photos.length) % photos.length)),
    [photos.length],
  );

  // 전체 화면일 때 키보드로 넘기고 배경 스크롤을 막는다
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, move]);

  if (photos.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold">
        축제 사진 <span className="text-sm font-normal text-zinc-500">{photos.length}장</span>
      </h2>

      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0">
        {photos.map((src, i) => (
          <li key={src} className="shrink-0">
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`${title} 사진 ${i + 1} 크게 보기`}
              className="relative block h-28 w-36 overflow-hidden rounded-xl bg-zinc-100 transition hover:opacity-90 dark:bg-zinc-800 sm:h-auto sm:w-full sm:aspect-square"
            >
              {/*
                썸네일은 모바일 144px, 데스크톱에서도 4칸이라 250px 남짓이다.
                sizes 를 vw 로 두면 화면폭마다 다른 너비를 요청해 이미지 변환이
                여러 벌 생긴다. 축제 사진만 수천 장이라 고정 폭 하나로 묶는다.
              */}
              <Image src={src} alt="" fill sizes="256px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 사진 ${open + 1} / ${photos.length}`}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button
            type="button"
            onClick={close}
            aria-label="닫기"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {photos.length > 1 && (
            <>
              <NavButton side="left" onClick={() => move(-1)} />
              <NavButton side="right" onClick={() => move(1)} />
            </>
          )}

          <div className="relative h-full max-h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[open]} alt={`${title} 사진 ${open + 1}`} fill sizes="100vw" className="object-contain" priority />
          </div>

          <p className="absolute bottom-6 left-0 right-0 text-center text-sm text-white/80">
            {open + 1} / {photos.length}
          </p>
        </div>
      )}
    </section>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "이전 사진" : "다음 사진"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={side === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}
