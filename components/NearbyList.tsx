"use client";

import { useCallback, useMemo, useState } from "react";
import type { FestivalCardData } from "@/lib/card";
import { distanceKm, formatDistance } from "@/lib/geo";
import { statusOf } from "@/lib/date";
import FestivalCard from "./FestivalCard";
import EmptyState from "./EmptyState";

interface Props {
  /** 좌표가 있는 축제만 (서버에서 걸러서 넘긴다) */
  festivals: FestivalCardData[];
  today: string;
}

type State = "idle" | "asking" | "ready" | "denied" | "unsupported" | "failed";

/** 반경 선택지 (km) */
const RADII = [20, 50, 100, 0] as const;
const RADIUS_LABEL: Record<number, string> = { 20: "20km", 50: "50km", 100: "100km", 0: "전국" };

/**
 * 내 주변 축제.
 * 위치는 브라우저에서만 쓰고 서버로 보내지 않는다.
 * 공연은 KOPIS 가 좌표를 주지 않아 축제만 대상이다.
 */
export default function NearbyList({ festivals, today }: Props) {
  const [state, setState] = useState<State>("idle");
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(50);
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unsupported");
      return;
    }
    setState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setState("ready");
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? "denied" : "failed"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  const results = useMemo(() => {
    if (!me) return [];
    return festivals
      .map((f) => ({ f, km: distanceKm(me.lat, me.lng, f.lat!, f.lng!) }))
      .filter(({ km }) => (radius === 0 ? true : km <= radius))
      .filter(({ f }) => (upcomingOnly ? statusOf(f.startDate, f.endDate, today) !== "ended" : true))
      .sort((a, b) => a.km - b.km)
      .slice(0, 60);
  }, [festivals, me, radius, upcomingOnly, today]);

  if (state !== "ready") {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
        <span aria-hidden className="mb-3 block text-4xl">📍</span>
        <p className="text-base font-semibold">가까운 축제부터 보여드릴게요</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          위치는 이 브라우저 안에서만 쓰고 어디에도 보내지 않아요. 좌표가 있는 축제 {festivals.length}개가 대상이에요.
        </p>

        {state === "denied" && (
          <p className="mx-auto mt-4 max-w-md rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            위치 접근이 막혀 있어요. 주소창 왼쪽 자물쇠를 눌러 위치를 허용으로 바꾼 뒤 다시 시도해 주세요.
          </p>
        )}
        {state === "unsupported" && (
          <p className="mx-auto mt-4 max-w-md rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            이 브라우저는 위치 기능을 지원하지 않아요.
          </p>
        )}
        {state === "failed" && (
          <p className="mx-auto mt-4 max-w-md rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            위치를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.
          </p>
        )}

        <button
          type="button"
          onClick={locate}
          disabled={state === "asking"}
          className="mt-5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {state === "asking" ? "위치 확인 중…" : "내 위치로 찾기"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-sm font-semibold">반경</span>
        {RADII.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRadius(r)}
            aria-pressed={radius === r}
            className={`h-8 rounded-full border px-3 text-sm font-medium transition ${
              radius === r
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {RADIUS_LABEL[r]}
          </button>
        ))}
        <label className="ml-auto flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          <input type="checkbox" checked={upcomingOnly} onChange={(e) => setUpcomingOnly(e.target.checked)} className="accent-brand-500" />
          끝난 건 빼기
        </label>
      </div>

      <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        가까운 순으로 {results.length}개
      </p>

      {results.length === 0 ? (
        <EmptyState title="이 반경에는 축제가 없어요" description="반경을 넓혀보세요." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {results.map(({ f, km }, i) => (
            <li key={f.id} className="relative">
              <span className="absolute -top-1.5 left-2 z-10 rounded-full bg-zinc-900/85 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur dark:bg-white/90 dark:text-zinc-900">
                {formatDistance(km)}
              </span>
              <FestivalCard festival={f} today={today} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
