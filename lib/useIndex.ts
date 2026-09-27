"use client";

import { useEffect, useState } from "react";
import type { ConcertCardData, FestivalCardData } from "./card";

/** public/data/index.json 의 모양. scripts/build-index.ts 가 만든다 */
export interface SiteIndex {
  festivals: (FestivalCardData & { address: string })[];
  concerts: (ConcertCardData & { cast: string })[];
}

const EMPTY: SiteIndex = { festivals: [], concerts: [] };

/** 한 번 받아 오면 탭이 닫힐 때까지 다시 받지 않는다 */
let cache: SiteIndex | null = null;
let inflight: Promise<SiteIndex> | null = null;

function load(basePath: string): Promise<SiteIndex> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch(`${basePath}/data/index.json`)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<SiteIndex>;
    })
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * 찾기·검색 화면이 쓰는 목록.
 *
 * 서버가 있을 때는 서버가 걸러서 내려줬지만, 완전 정적으로 내보내면서
 * 브라우저가 목록 파일을 받아 직접 거른다. 약 1MB 이고 한 번 받으면 캐시된다.
 */
export function useSiteIndex(): { data: SiteIndex; loading: boolean; failed: boolean } {
  const [data, setData] = useState<SiteIndex>(cache ?? EMPTY);
  const [loading, setLoading] = useState(!cache);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    // basePath 가 붙는 배포(GitHub Pages)에서도 맞는 경로를 찾는다
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    load(basePath)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, failed };
}
