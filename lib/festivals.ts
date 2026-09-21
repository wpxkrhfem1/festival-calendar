/**
 * 축제 데이터 접근 계층 (서버 컴포넌트/빌드 시 사용)
 * - data/festivals.json + data/overrides.json 을 읽어 병합한다
 * - 같은 id 면 overrides 가 우선, overrides 에만 있으면 새 축제로 추가, hidden 이면 제외
 * - 월/지역/검색용 조회 함수 제공
 */
import festivalsFile from "@/data/festivals.json";
import overridesFile from "@/data/overrides.json";
import type { Festival, FestivalDataFile, FestivalOverride, Tag } from "./types";
import { isLongRunning, monthKey, monthsBetween, targetYearForMonth, todayKST } from "./date";
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

/** 이 개수 미만이면 "아직 등록 중"으로 보고 지난해 같은 달을 참고용으로 함께 보여준다 */
const SPARSE_THRESHOLD = 5;

export interface MonthResult {
  /** 기준 연도 (오늘 기준 가장 가까운 앞의 해) */
  year: number;
  key: string;
  /** 기준 연도 축제 + (부족할 때) 지난해 같은 달 축제 */
  festivals: Festival[];
  /** 기준 연도에 등록된 건수 */
  upcomingCount: number;
  /** 지난해 축제를 참고용으로 합쳤는지 */
  pastYear: number | null;
}

/**
 * 1~12 월 번호로 조회. 연도는 오늘 기준으로 "가장 가까운 앞의" 해를 고른다.
 * 내년 달은 API 에 아직 일정이 거의 없으므로, 등록 건수가 적으면 올해 같은 달 축제를
 * 참고용으로 뒤에 붙인다 (매년 열리는 축제가 많아 실제로 유용하다).
 */
export function getFestivalsByMonth(month: number, today = todayKST()): MonthResult {
  const year = targetYearForMonth(month, today);
  const key = monthKey(year, month);
  const upcoming = getFestivalsByMonthKey(key);
  const nowYear = Number(today.slice(0, 4));

  if (year > nowYear && upcoming.length < SPARSE_THRESHOLD) {
    const pastKey = monthKey(year - 1, month);
    const ids = new Set(upcoming.map((f) => f.id));
    const past = getFestivalsByMonthKey(pastKey).filter((f) => !ids.has(f.id));
    if (past.length > 0) {
      return { year, key, festivals: [...upcoming, ...past], upcomingCount: upcoming.length, pastYear: year - 1 };
    }
  }
  return { year, key, festivals: upcoming, upcomingCount: upcoming.length, pastYear: null };
}

/** 12개월 요약 (홈 카드용) */
export function getMonthSummaries(today = todayKST()) {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const { year, key, festivals, upcomingCount, pastYear } = getFestivalsByMonth(month, today);
    // 콜라주용 대표 축제 4개: 이미지 있음 > 상설 아님(매달 같은 상설 공연이 반복되지 않게) > 기준 연도 순
    const score = (f: Festival) =>
      (f.thumbnail || f.image ? 0 : 4) + (isLongRunning(f.startDate, f.endDate) ? 2 : 0) + (f.months.includes(key) ? 0 : 1);
    const sample = [...festivals].sort((a, b) => score(a) - score(b)).slice(0, 4);
    const images = sample.map((f) => f.thumbnail || f.image);
    return { month, year, key, count: festivals.length, upcomingCount, pastYear, images, sample };
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
