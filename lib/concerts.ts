/**
 * 공연 데이터 접근 계층 (서버 컴포넌트/빌드 시 사용)
 * - data/concerts.json 을 읽어 월·지역·장르별로 조회한다
 * - 축제(lib/festivals.ts)와 데이터원·성격이 달라 목록을 섞지 않는다
 */
import concertsFile from "@/data/concerts.json";
import type { Concert, ConcertDataFile } from "./types";
import { isLongRunning, monthKey, monthsFromCurrent, targetYearForMonth, todayKST } from "./date";
import { REGIONS } from "./regions";

const data = concertsFile as unknown as ConcertDataFile;

const ALL: Concert[] = [...(data.concerts ?? [])].sort(
  (a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, "ko"),
);
const BY_ID = new Map(ALL.map((c) => [c.id, c]));
const BY_MONTH = new Map<string, Concert[]>();
for (const c of ALL) {
  for (const m of c.months) {
    const list = BY_MONTH.get(m) ?? [];
    list.push(c);
    BY_MONTH.set(m, list);
  }
}

/** 데이터 메타 (수집 시각 등) */
export function getConcertMeta() {
  return { ...data.meta, count: ALL.length };
}

export function getAllConcerts(): Concert[] {
  return ALL;
}

export function getConcertById(id: string): Concert | undefined {
  return BY_ID.get(id);
}

export function getConcertsByMonthKey(key: string): Concert[] {
  return BY_MONTH.get(key) ?? [];
}

/** 한 달에 대한 연도별 묶음 (축제 쪽과 같은 구조) */
export interface ConcertMonthYear {
  year: number;
  key: string;
  concerts: Concert[];
  past: boolean;
}

export interface ConcertMonthResult {
  month: number;
  years: ConcertMonthYear[];
  defaultYear: number;
}

/** 다가오는 해를 기본으로 열려면 이 개수 이상은 있어야 한다 */
const ENOUGH_FOR_DEFAULT = 5;

/**
 * 1~12 월로 조회. 연도를 섞지 않고 나눠서 돌려준다.
 * KOPIS 는 오늘부터 1년치만 수집하므로 보통 연도가 하나 또는 둘이다.
 */
export function getConcertsByMonth(month: number, today = todayKST()): ConcertMonthResult {
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));

  const years: ConcertMonthYear[] = [];
  for (const key of BY_MONTH.keys()) {
    const [y, m] = key.split("-").map(Number);
    if (m !== month || y < nowYear) continue;
    const concerts = getConcertsByMonthKey(key);
    if (concerts.length === 0) continue;
    years.push({ year: y, key, concerts, past: y === nowYear && month < nowMonth });
  }
  years.sort((a, b) => a.year - b.year);

  if (years.length === 0) {
    return { month, years: [], defaultYear: targetYearForMonth(month, today) };
  }
  const upcoming = years.find((y) => !y.past);
  const biggest = years.reduce((a, b) => (b.concerts.length > a.concerts.length ? b : a));
  const chosen = upcoming && upcoming.concerts.length >= ENOUGH_FOR_DEFAULT ? upcoming : biggest;
  return { month, years, defaultYear: chosen.year };
}

export function pickConcertMonthYear(result: ConcertMonthResult, year: number): ConcertMonthYear | undefined {
  return result.years.find((y) => y.year === year);
}

/**
 * 12개월 요약 (공연 홈 카드용).
 * KOPIS 는 오늘 이후 1년치만 주므로 1월부터 늘어놓으면 공연 1~2개짜리 빈 달이 앞에 온다.
 * 현재 달부터 시작하도록 순서를 돌린다.
 */
export function getConcertMonthSummaries(today = todayKST()) {
  const nowMonth = Number(today.slice(5, 7));
  return monthsFromCurrent(nowMonth).map((month) => {
    const result = getConcertsByMonth(month, today);
    const chosen = pickConcertMonthYear(result, result.defaultYear);
    const concerts = chosen?.concerts ?? [];
    // 포스터 있는 것 먼저, 오픈런(상시 공연)은 뒤로
    const score = (c: Concert) => (c.poster ? 0 : 4) + (c.openRun || isLongRunning(c.startDate, c.endDate) ? 2 : 0);
    const sample = [...concerts].sort((a, b) => score(a) - score(b)).slice(0, 4);
    return {
      month,
      year: result.defaultYear,
      count: concerts.length,
      otherYears: result.years
        .filter((y) => y.year !== result.defaultYear)
        .map((y) => ({ year: y.year, count: y.concerts.length })),
      images: sample.map((c) => c.poster),
      sample,
    };
  });
}

/** 아직 끝나지 않은 공연 (진행 중 + 예정) */
export function getLiveConcerts(today = todayKST()): Concert[] {
  return ALL.filter((c) => c.endDate >= today);
}

/** 데이터에 존재하는 장르 목록 (건수 많은 순) */
export function getAvailableGenres(list: Concert[] = ALL): string[] {
  const count = new Map<string, number>();
  for (const c of list) if (c.genre) count.set(c.genre, (count.get(c.genre) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);
}

/** 지역 슬러그로 조회 */
export function getConcertsByRegionSlug(slug: string): Concert[] {
  const region = REGIONS.find((r) => r.slug === slug);
  if (!region) return [];
  return ALL.filter((c) => c.sido === region.name);
}

/** 공연명·공연장·지역·장르 검색 */
export function searchConcerts(query: string): Concert[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return ALL.filter((c) => {
    const hay = `${c.title} ${c.venue} ${c.sido} ${c.genre} ${c.cast ?? ""}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}

/** 상세 추천: 같은 달 + 같은 장르 우선, 부족하면 같은 달 다른 장르 (최대 n개) */
export function getRelatedConcerts(c: Concert, n = 4): Concert[] {
  const sameMonth = new Set<Concert>();
  for (const m of c.months) for (const g of getConcertsByMonthKey(m)) if (g.id !== c.id) sameMonth.add(g);
  const list = [...sameMonth];
  const sameGenre = list.filter((g) => g.genre === c.genre);
  const others = list.filter((g) => g.genre !== c.genre);
  return [...sameGenre, ...others].slice(0, n);
}

/** 월 키 생성 (외부에서 쓰기 편하게 재수출) */
export { monthKey };
