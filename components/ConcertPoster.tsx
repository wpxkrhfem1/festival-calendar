"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  genre?: string;
  sizes?: string;
  priority?: boolean;
  /** true 면 포스터를 자르지 않고 전부 보여주고 뒤에 흐린 배경을 깐다 */
  contain?: boolean;
}

/** 장르별 기본 이모지 (포스터가 없을 때) */
function emojiFor(genre?: string): string {
  if (!genre) return "🎫";
  if (genre.includes("대중음악")) return "🎤";
  if (genre.includes("뮤지컬")) return "🎭";
  if (genre.includes("클래식")) return "🎻";
  if (genre.includes("국악")) return "🪕";
  if (genre.includes("무용")) return "💃";
  if (genre.includes("연극")) return "🎬";
  if (genre.includes("서커스") || genre.includes("마술")) return "🎪";
  return "🎫";
}

/**
 * 공연 포스터. KOPIS 포스터는 세로형이라 자르면 제목이 날아간다.
 * 포스터가 없거나 로드에 실패하면 장르 이모지로 대체한다.
 */
export default function ConcertPoster({ src, alt, genre, sizes = "(max-width: 640px) 100vw, 25vw", priority, contain }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-400 text-4xl">
        <span aria-hidden>{emojiFor(genre)}</span>
      </div>
    );
  }

  const common = { src, fill: true as const, sizes, onError: () => setFailed(true) };

  return (
    <>
      {contain && <Image {...common} alt="" aria-hidden priority={priority} className="scale-125 object-cover blur-2xl" />}
      <Image {...common} alt={alt} priority={priority} className={contain ? "object-contain" : "object-cover"} />
    </>
  );
}
