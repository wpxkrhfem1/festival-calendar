"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as LeafletMap, LayerGroup } from "leaflet";
import type { FestivalCardData } from "@/lib/card";
import { formatPeriod, isLongRunning, overlaps, WHEN_LABELS, whenRange, type WhenKey } from "@/lib/date";
import { searchIn } from "@/lib/search";
import { asset } from "@/lib/asset";

interface Props {
  /** 좌표가 있는 축제 (끝난 것은 서버에서 뺐다) */
  festivals: FestivalCardData[];
  today: string;
}

/** 지도 화면 범위 (남서·북동). Leaflet 객체 대신 숫자만 상태에 둔다 */
interface Box {
  s: number;
  w: number;
  n: number;
  e: number;
}

const FILTERS: WhenKey[] = ["ongoing", "weekend", "thisMonth", "upcoming"];
/** 아래 목록에 한 번에 보여줄 수. 가을엔 한 화면에 수십 개라 끝없이 길어진다 */
const LIST_STEP = 20;

/** 팝업에 넣을 글자. 축제 이름에 < > & 가 들어올 수 있어 걸러 넣는다 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function region(f: FestivalCardData): string {
  return [f.sido, f.sigungu].filter(Boolean).join(" ");
}

/**
 * 여러 축제를 한 지도 위에.
 *
 * 축제 745건 모두 좌표가 있는데 지금까지는 축제마다 카카오맵 링크만 있었다.
 * 리컴에리어는 카카오맵 위에 월 선택·검색·목록을 둔 "지도로 찾기" 가 있다 (2026-09-28 확인).
 * 그래서 시기 버튼에 더해 검색창과, 지금 지도에 보이는 축제만 모은 목록을 둔다.
 * 목록의 "위치 보기" 를 누르면 지도가 그 축제로 옮겨 가고 팝업이 열린다.
 *
 * 오픈스트리트맵 + Leaflet 을 쓴다. 발급받을 키가 없고 무료다.
 * Leaflet 은 window 를 건드려서 서버에서 그리면 안 된다. 그래서 화면에 붙은 뒤에 불러온다.
 */
export default function MapView({ festivals, today }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const markers = useRef(new Map<string, CircleMarker>());
  const [when, setWhen] = useState<WhenKey>("weekend");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<Box | null>(null);
  const [limit, setLimit] = useState(LIST_STEP);
  const [ready, setReady] = useState(false);

  const range = whenRange(when, today);
  const inRange = festivals.filter(
    (f) => typeof f.lat === "number" && typeof f.lng === "number" && overlaps(f.startDate, f.endDate, range),
  );
  // 연중 상설은 지도를 뒤덮어서 빼고 따로 센다
  const seasonal = inRange.filter((f) => !isLongRunning(f.startDate, f.endDate));
  const searched = query.trim()
    ? searchIn(seasonal, query, (f) => `${f.title} ${region(f)} ${f.tags.join(" ")}`).results
    : seasonal;
  const visible = (view
    ? searched.filter((f) => f.lat! >= view.s && f.lat! <= view.n && f.lng! >= view.w && f.lng! <= view.e)
    : searched
  )
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // 지도 한 번 만들기
  useEffect(() => {
    let alive = true;
    const shown = markers.current;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!alive || !box.current || map.current) return;
      const m = L.map(box.current, { scrollWheelZoom: false }).setView([36.3, 127.8], 7);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자',
      }).addTo(m);
      // 지도를 움직일 때마다 보이는 범위를 받아 아래 목록을 맞춘다
      m.on("moveend", () => {
        const b = m.getBounds();
        setView({ s: b.getSouth(), w: b.getWest(), n: b.getNorth(), e: b.getEast() });
      });
      map.current = m;
      layer.current = L.layerGroup().addTo(m);
      setReady(true);
    })();
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
      layer.current = null;
      shown.clear();
    };
  }, []);

  // 고른 시기·검색어에 맞춰 점 다시 찍기
  useEffect(() => {
    if (!ready || !map.current || !layer.current) return;
    let alive = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!alive || !map.current || !layer.current) return;
      layer.current.clearLayers();
      markers.current.clear();
      const points: [number, number][] = [];
      for (const f of searched) {
        const ll: [number, number] = [f.lat as number, f.lng as number];
        points.push(ll);
        const mk = L.circleMarker(ll, { radius: 7, weight: 2, color: "#ffffff", fillColor: "#f97316", fillOpacity: 0.9 })
          .bindPopup(
            `<div style="min-width:180px;font-family:inherit">
              <b style="font-size:14px">${escapeHtml(f.title)}</b><br>
              <span style="color:#71717a">${escapeHtml(formatPeriod(f.startDate, f.endDate))}</span><br>
              <span style="color:#71717a">${escapeHtml(region(f))}</span><br>
              <a href="${asset(`/festival/${f.id}/`)}" style="font-weight:600">자세히 보기 →</a>
            </div>`,
          )
          .addTo(layer.current);
        markers.current.set(f.id, mk);
      }
      if (points.length > 0) map.current.fitBounds(points, { padding: [30, 30], maxZoom: 11 });
    })();
    return () => {
      alive = false;
    };
    // searched 는 when·query 에서만 달라진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, when, query]);

  /**
   * 목록에서 고른 축제로 지도를 옮기고 팝업을 연다.
   * 날아가는 애니메이션(flyTo)은 requestAnimationFrame 으로 움직여서, 탭이 가려져 있으면
   * 끝나지 않고 팝업도 안 열렸다 (2026-09-28 확인). 그래서 한 번에 옮긴다.
   */
  function focus(f: FestivalCardData) {
    const m = map.current;
    const mk = markers.current.get(f.id);
    if (!m || !mk) return;
    box.current?.scrollIntoView({ block: "center" });
    m.setView([f.lat as number, f.lng as number], Math.max(m.getZoom(), 12), { animate: false });
    mk.openPopup();
  }

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((k) => {
          const on = when === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setWhen(k);
                setLimit(LIST_STEP);
              }}
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

      <label htmlFor="map-search" className="sr-only">
        축제 이름이나 지역으로 찾기
      </label>
      <input
        id="map-search"
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLimit(LIST_STEP);
        }}
        placeholder="축제 이름이나 지역 (예: 불꽃, 강릉)"
        className="mb-3 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-700 dark:bg-zinc-900"
      />

      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        지도에 축제 {searched.length}개
        {!query.trim() && inRange.length > seasonal.length && ` · 1년 내내 하는 상설 ${inRange.length - seasonal.length}개는 뺐어요`}
      </p>

      <div
        ref={box}
        role="region"
        aria-label="축제 지도"
        className="h-[60vh] min-h-[380px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
      />
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">점을 누르면 축제 이름과 기간이 나와요. 지도는 두 손가락으로 움직이세요.</p>

      {/* 지금 지도에 보이는 축제. 지도를 못 쓰는 사람(화면 낭독기 등)도 여기서 같은 내용을 본다 */}
      <section className="mt-6">
        <h2 className="text-base font-bold" aria-live="polite">
          지도에 보이는 축제 <span className="font-normal text-zinc-500 dark:text-zinc-400">{visible.length}개</span>
        </h2>
        {visible.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {searched.length === 0 ? "조건에 맞는 축제가 없어요. 시기나 검색어를 바꿔 보세요." : "지도를 줄이거나 옮기면 축제가 나와요."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {visible.slice(0, limit).map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/festival/${f.id}/`}
                    className="block truncate font-semibold hover:text-brand-600 hover:underline dark:hover:text-brand-300"
                  >
                    {f.title}
                  </Link>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {region(f)} · {formatPeriod(f.startDate, f.endDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => focus(f)}
                  className="shrink-0 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:text-zinc-200"
                >
                  위치 보기
                </button>
              </li>
            ))}
          </ul>
        )}
        {visible.length > limit && (
          <button
            type="button"
            onClick={() => setLimit((n) => n + LIST_STEP)}
            className="mt-3 w-full rounded-xl border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-700 hover:border-brand-400 dark:border-zinc-700 dark:text-zinc-200"
          >
            {visible.length - limit}개 더 보기
          </button>
        )}
      </section>
    </div>
  );
}
