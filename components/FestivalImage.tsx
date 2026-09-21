"use client";

import Image from "next/image";
import { useState } from "react";
import type { Tag } from "@/lib/types";
import { placeholderFor } from "@/lib/tags";

interface Props {
  src: string;
  alt: string;
  tags: Tag[];
  sizes?: string;
  priority?: boolean;
  /**
   * cover  : 틀을 꽉 채우고 넘치는 부분은 자른다 (작은 콜라주 칸처럼 잘려도 되는 곳)
   * contain: 이미지를 자르지 않고 전부 보여주고, 남는 자리는 같은 이미지를 흐리게 깔아 채운다
   */
  fit?: "cover" | "contain";
  className?: string;
}

/**
 * 축제 이미지.
 * - 원본이 없거나 로드에 실패하면 카테고리별 플레이스홀더로 대체한다.
 * - tong.visitkorea.or.kr 만 next/image 최적화를 거치고, 그 외 도메인은 그대로 표시.
 * - fit="contain" 이면 배경에 같은 이미지를 흐리게 깔아 여백을 메운다.
 *   같은 URL 이라 네트워크 요청은 한 번만 일어난다.
 */
export default function FestivalImage({
  src,
  alt,
  tags,
  sizes = "(max-width: 640px) 100vw, 33vw",
  priority,
  fit = "cover",
  className,
}: Props) {
  const [failed, setFailed] = useState(false);
  const fallback = placeholderFor(tags);
  const useFallback = failed || !src;
  const finalSrc = useFallback ? fallback : src;
  const isRemoteAllowed = /^https?:\/\/tong\.visitkorea\.or\.kr\//.test(finalSrc);

  // 플레이스홀더는 틀에 맞게 그린 그림이라 항상 꽉 채운다
  const useBackdrop = fit === "contain" && !useFallback;

  const common = {
    src: finalSrc,
    fill: true as const,
    sizes,
    unoptimized: !isRemoteAllowed && !useFallback,
  };

  return (
    <>
      {useBackdrop && (
        <Image
          {...common}
          alt=""
          aria-hidden
          priority={priority}
          className="scale-125 object-cover blur-2xl"
        />
      )}
      <Image
        {...common}
        alt={alt}
        priority={priority}
        onError={() => setFailed(true)}
        className={className ?? (useBackdrop ? "object-contain" : "object-cover")}
      />
    </>
  );
}
