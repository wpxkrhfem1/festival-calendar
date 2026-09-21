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
  className?: string;
}

/**
 * 축제 이미지. 원본이 없거나 로드에 실패하면 카테고리별 플레이스홀더로 대체한다.
 * tong.visitkorea.or.kr 만 next/image 최적화를 거치고, 그 외 도메인은 unoptimized 로 표시.
 */
export default function FestivalImage({ src, alt, tags, sizes = "(max-width: 640px) 100vw, 33vw", priority, className }: Props) {
  const [failed, setFailed] = useState(false);
  const fallback = placeholderFor(tags);
  const useFallback = failed || !src;
  const finalSrc = useFallback ? fallback : src;
  const isRemoteAllowed = /^https?:\/\/tong\.visitkorea\.or\.kr\//.test(finalSrc);

  return (
    <Image
      src={finalSrc}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isRemoteAllowed && !useFallback}
      onError={() => setFailed(true)}
      className={className ?? "object-cover"}
    />
  );
}
