/**
 * 축제 데이터 접근 계층 (서버 컴포넌트/빌드 시 사용)
 * - data/festivals.json + data/overrides.json 을 읽어 병합한다
 * - 같은 id 면 overrides 가 우선, overrides 에만 있으면 새 축제로 추가, hidden 이면 제외
 * - 월/지역/검색용 조회 함수 제공
 */
import festivalsFile from "@/data/festivals.json";
import overridesFile from "@/data/overrides.json";
import type { Festival, FestivalDataFile, FestivalOverride, Tag } from "./types";
import { monthKey, monthsBetween, targetYearForMonth, todayKST } from "./date";
import { classifyTags } from "./tags";
import { regionBySlug } from "./regions";

const data = festivalsFile as unknown as FestivalDataFile;
const overrides = (overridesFile as unknown as { festivals?: FestivalOverride[] }).festivals ?? [];

/** overrides 를 적용한 최종 목록 (모듈 로드 시 1회 계산) */
function applyOverrides(base: Festival[], ovs: FestivalOverride[]): Festival[] {
  const map = new Map(base.map((f) => [f.id, f]));
  for (const ov of ovs) {
    if (!ov.id) continue;
    if (ov.hidden) {
      map.delete(ov.id);
      continue;
    }
    const existing = map.get(ov.id);
    if (existing) {
      const merged: Festival = { ...existing, ...stripUndefined(ov) };
      // 날짜가 바뀌었으면 걸치는 달·계절 태그를 다시 계산
      if (ov.startDate || ov.endDate) {
        merged.months = monthsBetween(merged.startDate, merged.endDate);
        if (!ov.tags) merged.tags = classifyTags(merged.title, merged.overview, merged.startDate);
      }
      map.set(ov.id, merged);
    } else if (ov.title && ov.startDate) {
      // 신규 축제: 필수값이 있어야만 추가
      const endDate = ov.endDate ?? ov.startDate;
      const created: Festival = {
        id: ov.id,
        title: ov.title,
        startDate: ov.startDate,
        endDate,
        sido: ov.sido ?? "",
        sigungu: ov.sigungu ?? "",
        address: ov.address ?? "",
        image: ov.image ?? "",
        thumbnail: ov.thumbnail ?? ov.image ?? "",
        tel: ov.tel ?? "",
        homepage: ov.homepage ?? "",
        overview: ov.overview ?? "",
        tags: ov.tags ?? classifyTags(ov.title, ov.overview ?? "", ov.startDate),
        months: monthsBetween(ov.startDate, endDate),
        place: ov.place,
        playtime: ov.playtime,
        fee: ov.fee,
        sponsor: ov.sponsor,
        lng: ov.lng,
        lat: ov.lat,
      };
      map.set(ov.id, created);
    }
  }
  return [...map.values()].sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, "ko"));
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && k !== "hidden") (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

const ALL: Festival[] = applyOverrides(data.festivals ?? [], overrides);
const BY_ID = new Map(ALL.map((f) => [f.id, f]));
const BY_MONTH = new Map<string, Festival[]>();
for (const f of ALL) {
  for (const m of f.months) {
    const list = BY_MONTH.get(m) ?? [];
    list.push(f);
    BY_MONTH.set(m, list);
  }
}

/** 데이터 메타 정보 (수집 시각 등) */
export function getDataMeta() {
  return { ...data.meta, count: ALL.length };
}

export function getAllFestivals(): Festival[] {
  return ALL;
}

export function getFestivalById(id: string): Festival | undefined {
  return BY_ID.get(id);
}

/** "YYYY-MM" 키로 조회 (시작일 순) */
export function getFestivalsByMonthKey(key: string): Festival[] {
  return BY_MONTH.get(key) ?? [];
}

/**
 * 1~12 월 번호로 조회. 연도는 오늘 기준으로 "가장 가까운 앞의" 해를 고른다.
 * 반환값에 실제 연도를 포함해 UI 에서 "2027년 1월" 처럼 표기할 수 있게 한다.
 */
export function getFestivalsByMonth(month: number, today = todayKST()): { year: number; key: string; festivals: Festival[] } {
  const year = targetYearForMonth(month, today);
  const key = monthKey(year, month);
  return { year, key, festivals: getFestivalsByMonthKey(key) };
}

/** 12개월 요약 (홈 카드용) */
export function getMonthSummaries(today = todayKST()) {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const { year, key, festivals } = getFestivalsByMonth(month, today);
    const images = festivals
      .map((f) => f.thumbnail || f.image)
      .filter(Boolean)
      .slice(0, 4);
    return { month, year, key, count: festivals.length, images, sample: festivals.slice(0, 3) };
  });
}

/** 지역 슬러그로 조회 (전체 기간) */
export function getFestivalsByRegionSlug(slug: string): Festival[] {
  const region = regionBySlug(slug);
  if (!region) return [];
  return ALL.filter((f) => f.sido === region.name);
}

/** 데이터에 실제로 존재하는 시도 목록 (가나다순) */
export function getAvailableSidos(festivals: Festival[] = ALL): string[] {
  return [...new Set(festivals.map((f) => f.sido).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
}

/** 축제명/지역/주소 검색 (공백 구분 AND 검색) */
export function searchFestivals(query: string): Festival[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return ALL.filter((f) => {
    const hay = `${f.title} ${f.sido} ${f.sigungu} ${f.address} ${f.tags.join(" ")}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/**
 * 상세 페이지 추천: 같은 달 + 같은 지역 우선, 부족하면 같은 달 다른 지역으로 채움 (최대 n개)
 */
export function getRelatedFestivals(f: Festival, n = 4): Festival[] {
  const sameMonth = new Set<Festival>();
  for (const m of f.months) for (const g of getFestivalsByMonthKey(m)) if (g.id !== f.id) sameMonth.add(g);
  const list = [...sameMonth];
  const sameRegion = list.filter((g) => g.sido === f.sido);
  const others = list.filter((g) => g.sido !== f.sido);
  return [...sameRegion, ...others].slice(0, n);
}

export function hasTag(f: Festival, tag: Tag): boolean {
  return f.tags.includes(tag);
}
