/**
 * 축제 데이터 접근 계층 (서버 컴포넌트/빌드 시 사용)
 * - data/festivals.json + data/overrides.json 을 읽어 병합한다
 * - 같은 id 면 overrides 가 우선, overrides 에만 있으면 새 축제로 추가, hidden 이면 제외
 * - 월/지역/검색용 조회 함수 제공
 */
import festivalsFile from "@/data/festivals.json";
import overridesFile from "@/data/overrides.json";
import type { Festival, FestivalDataFile, FestivalOverride, Tag } from "./types";
import { isLongRunning, monthsBetween, monthsFromCurrent, statusOf, targetYearForMonth, todayKST } from "./date";
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
      // extraTags 는 덮어쓰지 않고 더한다 (계절 태그를 잃지 않기 위해)
      if (ov.extraTags?.length) merged.tags = [...new Set([...merged.tags, ...ov.extraTags])];
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
        tags: [...new Set([...(ov.tags ?? classifyTags(ov.title, ov.overview ?? "", ov.startDate)), ...(ov.extraTags ?? [])])],
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
    // _ 로 시작하는 키는 파일에 적어둔 메모라 데이터에 섞지 않는다
    if (v !== undefined && k !== "hidden" && k !== "extraTags" && !k.startsWith("_")) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

/**
 * 태그를 현재 규칙으로 다시 매긴다.
 *
 * festivals.json 에는 수집 당시의 태그가 박혀 있다. 그래서 lib/tags.ts 의 분류
 * 규칙을 고쳐도 데이터를 다시 받기 전까지 화면이 그대로였다 — 실제로 규칙을
 * 두 번 고치고도 사이트에는 반영이 안 된 채였다. 읽을 때 다시 계산해서
 * 규칙 파일이 항상 최종 결정권을 갖게 한다. 742건이라 비용은 무시할 수준이다.
 */
function retag(list: Festival[]): Festival[] {
  return list.map((f) => ({ ...f, tags: classifyTags(f.title, f.overview, f.startDate) }));
}

const ALL: Festival[] = applyOverrides(retag(data.festivals ?? []), overrides);
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

/** 한 달에 대한 연도별 묶음 */
export interface MonthYear {
  year: number;
  /** "YYYY-MM" */
  key: string;
  festivals: Festival[];
  /** 이 연·월이 이미 지났는지 (오늘 기준) */
  past: boolean;
}

export interface MonthResult {
  month: number;
  /** 데이터에 존재하는 연도 묶음 (오름차순). 축제가 0건인 해는 제외 */
  years: MonthYear[];
  /** 처음에 열어 보여줄 연도 */
  defaultYear: number;
}

/**
 * 다가오는 해를 기본으로 열려면 이 개수 이상은 등록돼 있어야 한다.
 * 내년 일정은 아직 거의 안 올라와서, 무조건 내년을 열면 빈 화면처럼 보인다.
 */
const ENOUGH_FOR_DEFAULT = 5;

/**
 * 1~12 월 번호로 조회.
 * 연도를 섞지 않고 연도별로 나눠서 돌려준다. 화면에서 연도 탭으로 고르게 한다.
 *
 * 기본 선택은 "아직 지나지 않은 가장 이른 해" 다. 다만 그 해에 등록된 축제가
 * ENOUGH_FOR_DEFAULT 미만이면 축제가 가장 많은 해를 연다.
 * 내년 일정이 쌓이면 자연히 내년이 기본이 된다.
 */
export function getFestivalsByMonth(month: number, today = todayKST()): MonthResult {
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));

  // 데이터에 존재하는 연도 중 올해 이후만 모은다.
  // 여러 해에 걸친 상설 공연 때문에 지난 해들이 1건씩 딸려오는데, 목록에 쓸모가 없다.
  const years: MonthYear[] = [];
  for (const key of BY_MONTH.keys()) {
    const [y, m] = key.split("-").map(Number);
    if (m !== month || y < nowYear) continue;
    const festivals = getFestivalsByMonthKey(key);
    if (festivals.length === 0) continue;
    years.push({ year: y, key, festivals, past: y === nowYear && month < nowMonth });
  }
  years.sort((a, b) => a.year - b.year);

  if (years.length === 0) {
    return { month, years: [], defaultYear: targetYearForMonth(month, today) };
  }

  const upcoming = years.find((y) => !y.past);
  const biggest = years.reduce((a, b) => (b.festivals.length > a.festivals.length ? b : a));
  const chosen = upcoming && upcoming.festivals.length >= ENOUGH_FOR_DEFAULT ? upcoming : biggest;
  return { month, years, defaultYear: chosen.year };
}

/** 특정 연·월 묶음 꺼내기 (없으면 undefined) */
export function pickMonthYear(result: MonthResult, year: number): MonthYear | undefined {
  return result.years.find((y) => y.year === year);
}

/**
 * 12개월 요약 (홈 카드용). 기본 연도 기준으로 집계한다.
 * 현재 달부터 한 바퀴 돌려 다가오는 달이 앞에 오게 한다.
 * past 는 그 카드가 가리키는 연·월이 이미 지났는지다 (화면에서 따로 묶어 보여준다).
 */
export function getMonthSummaries(today = todayKST()) {
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));
  return monthsFromCurrent(nowMonth).map((month) => {
    const result = getFestivalsByMonth(month, today);
    const chosen = pickMonthYear(result, result.defaultYear);
    const festivals = chosen?.festivals ?? [];
    // 콜라주용 대표 축제 4개: 이미지 있는 것 먼저, 상설 공연은 뒤로 (매달 같은 그림이 반복되지 않게)
    const score = (f: Festival) => (f.image || f.thumbnail ? 0 : 4) + (isLongRunning(f.startDate, f.endDate) ? 2 : 0);
    const sample = [...festivals].sort((a, b) => score(a) - score(b)).slice(0, 4);
    const year = result.defaultYear;
    return {
      month,
      year,
      // 이 카드가 가리키는 연·월이 이미 지났는지
      past: year < nowYear || (year === nowYear && month < nowMonth),
      count: festivals.length,
      /** 다른 해에도 이 달 축제가 있는지 (카드에 "2027년도 보기" 같은 힌트를 줄 때 사용) */
      otherYears: result.years.filter((y) => y.year !== result.defaultYear).map((y) => ({ year: y.year, count: y.festivals.length })),
      images: sample.map((f) => f.image || f.thumbnail),
      sample,
    };
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

/**
 * 아직 끝나지 않은 축제 (진행 중 + 예정).
 *
 * 전체 742건 중 506건(68%)이 이미 지난 축제다. 사이트맵·추천처럼
 * "지금 갈 수 있는 곳"을 다뤄야 하는 자리에서는 이 목록만 쓴다.
 */
export function getLiveFestivals(today = todayKST()): Festival[] {
  return ALL.filter((f) => f.endDate >= today);
}

/**
 * 끝난 축제 페이지에서 대신 보여줄 축제.
 * 같은 지역 → 기간 한정 → 지금 열리는 것 순으로 우선한다.
 *
 * 연중 상설 전시(페인터즈, 숭례문 파수의식 같은 것)는 시작일이 훨씬 앞서 있어서
 * 그냥 시작일 순으로 고르면 네 칸이 전부 상설로 찬다. 실제로 그렇게 나왔다.
 * 그래서 장기 운영은 뒤로 미룬다.
 */
export function getAlternativeFestivals(f: Festival, n = 4, today = todayKST()): Festival[] {
  const live = getLiveFestivals(today).filter((g) => g.id !== f.id);
  const rank = (g: Festival) =>
    (g.sido === f.sido ? 0 : 4) +
    (isLongRunning(g.startDate, g.endDate) ? 2 : 0) +
    (statusOf(g.startDate, g.endDate, today) === "ongoing" ? 0 : 1);
  return [...live].sort((a, b) => rank(a) - rank(b) || a.startDate.localeCompare(b.startDate)).slice(0, n);
}

export function hasTag(f: Festival, tag: Tag): boolean {
  return f.tags.includes(tag);
}
