/**
 * 전국문화축제표준데이터 → Festival 변환과, 관광공사 데이터와 겹치는 것 걸러내기
 *
 * 관광공사 TourAPI 에는 지자체 소규모 축제가 빠져 있다. 리컴에리어에 오늘 시작으로 뜬
 * "동작댄스데이" 가 TourAPI 키워드 검색으로는 0건이었고 이 데이터에는 있었다 (2026-09-28 확인).
 * 이 데이터는 지자체가 직접 올리고 문화체육관광부가 모은다. 분기마다 갱신된다.
 *
 * 같은 축제가 두 데이터에 다 있으면 관광공사 쪽을 쓴다. 사진·개요·상세가 더 풍부하다.
 */
import type { Festival, RawStdFestival } from "./types";
import { isIsoDate, monthsBetween, overlaps } from "./date";
import { parseAddress } from "./regions";
import { classifyTags } from "./tags";
import { cleanTel } from "./normalize";

/**
 * 이름 비교용 열쇠. 회차·연도·괄호 속 글자·따옴표·띄어쓰기를 지운다.
 * "제38회 춘천인형극제" 와 "2026 춘천인형극제",
 * "장미꽃 필(Feel) 무렵" 과 "장미꽃 필 무렵" 을 같은 이름으로 본다.
 */
export function nameKey(title: string): string {
  return title
    .replace(/\([^)]*\)/g, "")
    .replace(/제\s*\d+\s*회/g, "")
    .replace(/(19|20)\d{2}(년)?/g, "")
    .replace(/festival/gi, "페스티벌")
    .replace(/[\s()[\]<>〈〉《》「」『』"'`‘’“”·.,!?~\-_:]/g, "")
    .toLowerCase();
}

/** 두 글자씩 끊은 조각이 얼마나 겹치는지 (0~1, Dice 계수) */
export function nameSimilarity(a: string, b: string): number {
  const grams = (s: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) out.set(s.slice(i, i + 2), (out.get(s.slice(i, i + 2)) ?? 0) + 1);
    return out;
  };
  const ga = grams(a);
  const gb = grams(b);
  let common = 0;
  for (const [g, n] of ga) common += Math.min(n, gb.get(g) ?? 0);
  const total = Math.max(a.length - 1, 0) + Math.max(b.length - 1, 0);
  return total === 0 ? 0 : (2 * common) / total;
}

/** 32비트 FNV-1a. 주소에 쓸 짧고 늘 같은 id 를 만든다 */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function coord(raw: string | undefined, min: number, max: number): number | undefined {
  const n = Number(raw);
  // 한반도 밖 좌표는 입력 실수다 (위경도를 뒤바꿔 넣은 경우 등)
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

function homepage(raw: string | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  // "www.xxx.go.kr" 처럼 스킴 없이 적힌 게 많다
  return /^[\w-]+(\.[\w-]+)+/.test(s) ? `https://${s}` : "";
}

/**
 * 한 줄 변환. 날짜가 틀렸거나 이름이 없으면 null.
 *
 * id 는 "s" + (기관코드·이름·시작일) 해시다. 관광공사 id(숫자)와 겹치지 않게 앞에 s 를 붙인다.
 * 시작일이 바뀌면(연기) id 도 바뀐다. 같은 기관이 같은 이름으로 한 해 두 번 여는 축제가 있어서
 * 연도만으로는 구분이 안 된다.
 */
export function normalizeStdFestival(raw: RawStdFestival): Festival | null {
  const title = (raw.fstvlNm ?? "").trim();
  const startDate = (raw.fstvlStartDate ?? "").trim();
  let endDate = (raw.fstvlEndDate ?? "").trim() || startDate;
  if (!title || !isIsoDate(startDate) || !isIsoDate(endDate)) return null;
  if (endDate < startDate) endDate = startDate;

  const address = (raw.rdnmadr || raw.lnmadr || "").trim();
  // 주소가 비었으면 올린 기관 이름("서울특별시 동작구")에서 지역을 찾는다
  const { sido, sigungu } = parseAddress(address || raw.insttNm);
  const overview = (raw.fstvlCo ?? "").trim();
  const sponsor = [...new Set([raw.mnnstNm, raw.auspcInsttNm].map((s) => (s ?? "").trim()).filter(Boolean))].join(" / ");

  const f: Festival = {
    id: `s${hash(`${raw.insttCode ?? ""}|${nameKey(title)}|${startDate}`)}`,
    title,
    startDate,
    endDate,
    sido,
    sigungu,
    address,
    image: "",
    thumbnail: "",
    tel: cleanTel(raw.phoneNumber),
    homepage: homepage(raw.homepageUrl),
    overview,
    tags: classifyTags(title, overview, startDate),
    months: monthsBetween(startDate, endDate),
    lat: coord(raw.latitude, 33, 39),
    lng: coord(raw.longitude, 124, 132),
    source: "std",
  };
  if (raw.opar?.trim()) f.place = raw.opar.trim();
  if (sponsor) f.sponsor = sponsor;
  // 기준일을 관광공사 modifiedtime 형식으로 맞춰 "언제 정보인지" 표시를 같이 쓴다
  if (raw.referenceDate && isIsoDate(raw.referenceDate)) f.modifiedTime = `${raw.referenceDate.replace(/-/g, "")}000000`;
  return f;
}

/**
 * 같은 축제인지. 지역이 같고 기간이 겹치면서 다음 중 하나일 때.
 *  - 이름이 같거나 한쪽이 다른 쪽을 품는다
 *  - 같은 시·군·구이고 이름 유사도가 0.5 이상 ("반딧불 곤충축제" ↔ "반딧불이 곤충축제",
 *    "하남이성산성문화축제" ↔ "하남이성산성문화제")
 * 2026-09-28 데이터로 재 보니 이 규칙 없이는 이런 쌍이 둘 다 목록에 올라왔다.
 * "진해군악의장페스티벌" ↔ "진해군항제" 는 유사도가 낮아 따로 둔다 (실제로 다른 행사).
 */
export function sameFestival(a: Festival, b: Festival): boolean {
  if (a.sido && b.sido && a.sido !== b.sido) return false;
  if (!overlaps(a.startDate, a.endDate, { from: b.startDate, to: b.endDate })) return false;
  const ka = nameKey(a.title);
  const kb = nameKey(b.title);
  if (ka === kb) return true;
  const [short, long] = ka.length <= kb.length ? [ka, kb] : [kb, ka];
  // 너무 짧으면("축제") 아무거나 품으니 네 글자 이상일 때만
  if (short.length >= 4 && long.includes(short)) return true;
  const sameTown = !!a.sigungu && a.sigungu === b.sigungu;
  return sameTown && nameSimilarity(ka, kb) >= 0.5;
}

/** 정보가 더 많은 쪽 (좌표 > 홈페이지 > 개요 길이) */
function richer(a: Festival, b: Festival): Festival {
  const score = (f: Festival) => (f.lat ? 4 : 0) + (f.homepage ? 2 : 0) + f.overview.length / 10000;
  return score(b) > score(a) ? b : a;
}

/** 표준데이터 안의 중복 정리 (같은 이름·같은 시작일이 여러 번 올라온 경우가 있다) */
export function dedupeStd(list: Festival[]): Festival[] {
  const byKey = new Map<string, Festival>();
  for (const f of list) {
    const k = `${f.sido}|${nameKey(f.title)}|${f.startDate}`;
    const prev = byKey.get(k);
    byKey.set(k, prev ? richer(prev, f) : f);
  }
  return [...byKey.values()];
}

/** 관광공사 목록에 표준데이터 중 겹치지 않는 것만 더한다 */
export function mergeStd(tour: Festival[], std: Festival[]): Festival[] {
  const extra = dedupeStd(std).filter((s) => !tour.some((t) => sameFestival(t, s)));
  return [...tour, ...extra];
}
