"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { FestivalCardData } from "@/lib/card";
import { formatPeriod, isLongRunning, overlaps, WHEN_LABELS, whenRange, type WhenKey } from "@/lib/date";
import { asset } from "@/lib/asset";

interface Props {
  /** 좌표가 있는 축제 (끝난 것은 서버에서 뺐다) */
  festivals: FestivalCardData[];
  today: string;
}

const FILTERS: WhenKey[] = ["ongoing", "weekend", "thisMonth", "upcoming"];

/** 팝업에 넣을 글자. 축제 이름에 < > & 가 들어올 수 있어 걸러 넣는다 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * 여러 축제를 한 지도 위에.
 *
 * 축제 745건 모두 좌표가 있는데 지금까지는 축제마다 카카오맵 링크만 있었다.
 * 리컴에리어는 카카오맵 위에 월 선택·검색·목록을 둔 "지도로 찾기" 가 있다 (2026-09-28 확인).
 *
 * 오픈스트리트맵 + Leaflet 을 쓴다. 발급받을 키가 없고 무료다.
 * Leaflet 은 window 를 건드려서 서버에서 그리면 안 된다. 그래서 화면에 붙은 뒤에 불러온다.
 */
export default function MapView({ festivals, today }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [when, setWhen] = useState<WhenKey>("weekend");
  const [ready, setReady] = useState(false);

  const range = whenRange(when, today);
  const shown = festivals.filter(
    (f) => typeof f.lat === "number" && typeof f.lng === "number" && overlaps(f.startDate, f.endDate, range),
  );
  // 연중 상설은 지도를 뒤덮어서 기본으로 빼고 따로 센다
  const seasonal = shown.filter((f) => !isLongRunning(f.startDate, f.endDate));

  // 지도 한 번 만들기
  useEffect(() => {
    let alive = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!alive || !box.current || map.current) return;
      const m = L.map(box.current, { scrollWheelZoom: false }).setView([36.3, 127.8], 7);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자',
      }).addTo(m);
      map.current = m;
      layer.current = L.layerGroup().addTo(m);
      setReady(true);
    })();
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  // 고른 시기에 맞춰 점 다시 찍기
  useEffect(() => {
    if (!ready || !map.current || !layer.current) return;
    let alive = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!alive || !map.current || !layer.current) return;
      layer.current.clearLayers();
      const points: [number, number][] = [];
      for (const f of seasonal) {
        const ll: [number, number] = [f.lat as number, f.lng as number];
        points.push(ll);
        L.circleMarker(ll, { radius: 7, weight: 2, color: "#ffffff", fillColor: "#f97316", fillOpacity: 0.9 })
          .bindPopup(
            `<div style="min-width:180px;font-family:inherit">
              <b style="font-size:14px">${escapeHtml(f.title)}</b><br>
              <span style="color:#71717a">${escapeHtml(formatPeriod(f.startDate, f.endDate))}</span><br>
              <span style="color:#71717a">${escapeHtml([f.sido, f.sigungu].filter(Boolean).join(" "))}</span><br>
              <a href="${asset(`/festival/${f.id}/`)}" style="font-weight:600">자세히 보기 →</a>
            </div>`,
          )
          .addTo(layer.current);
      }
      if (points.length > 0) map.current.fitBounds(points, { padding: [30, 30], maxZoom: 11 });
    })();
    return () => {
      alive = false;
    };
    // seasonal 은 when 에서만 달라진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, when]);

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((k) => {
          const on = when === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setWhen(k)}
              aria-pressed={on}
              className={`h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                on
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-brand-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              }`}
            >
              {WHEN_LABELS[k]}
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        지도에 축제 {seasonal.length}개
        {shown.length > seasonal.length && ` · 1년 내내 하는 상설 ${shown.length - seasonal.length}개는 뺐어요`}
      </p>

      <div
        ref={box}
        role="region"
        aria-label="축제 지도"
        className="h-[65vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
      />
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">점을 누르면 축제 이름과 기간이 나와요. 지도는 두 손가락으로 움직이세요.</p>

      {/* 지도를 못 쓰는 사람(화면 낭독기 등)을 위해 같은 목록을 글로도 둔다 */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-semibold">목록으로 보기 ({seasonal.length}개)</summary>
        <ul className="mt-3 grid gap-1 text-sm">
          {seasonal
            .slice()
            .sort((a, b) => a.startDate.localeCompare(b.startDate))
            .map((f) => (
              <li key={f.id}>
                <Link href={`/festival/${f.id}/`} className="hover:text-brand-600 hover:underline dark:hover:text-brand-300">
                  {f.title}
                </Link>
                <span className="text-zinc-500 dark:text-zinc-400"> · {[f.sido, f.sigungu].filter(Boolean).join(" ")} · {formatPeriod(f.startDate, f.endDate)}</span>
              </li>
            ))}
        </ul>
      </details>
    </div>
  );
}
