/**
 * 지역(시도) 정의
 * - TourAPI areaCode ↔ 시도 짧은 이름 ↔ URL 슬러그 매핑
 * - 주소 문자열의 첫 단어("서울특별시", "강원특별자치도" 등)를 짧은 이름으로 정규화
 */

export interface Region {
  /** 짧은 이름 (UI 표시·데이터 저장용) */
  name: string;
  /** URL 슬러그 (/region/[sido]) */
  slug: string;
  /** TourAPI areaCode */
  areaCode: string;
  /** 주소 첫 단어로 등장하는 정식/구 명칭들 */
  aliases: string[];
}

export const REGIONS: Region[] = [
  { name: "서울", slug: "seoul", areaCode: "1", aliases: ["서울특별시", "서울시", "서울"] },
  { name: "인천", slug: "incheon", areaCode: "2", aliases: ["인천광역시", "인천시", "인천"] },
  { name: "대전", slug: "daejeon", areaCode: "3", aliases: ["대전광역시", "대전시", "대전"] },
  { name: "대구", slug: "daegu", areaCode: "4", aliases: ["대구광역시", "대구시", "대구"] },
  { name: "광주", slug: "gwangju", areaCode: "5", aliases: ["광주광역시", "광주시", "광주"] },
  { name: "부산", slug: "busan", areaCode: "6", aliases: ["부산광역시", "부산시", "부산"] },
  { name: "울산", slug: "ulsan", areaCode: "7", aliases: ["울산광역시", "울산시", "울산"] },
  { name: "세종", slug: "sejong", areaCode: "8", aliases: ["세종특별자치시", "세종시", "세종"] },
  { name: "경기", slug: "gyeonggi", areaCode: "31", aliases: ["경기도", "경기"] },
  { name: "강원", slug: "gangwon", areaCode: "32", aliases: ["강원특별자치도", "강원도", "강원"] },
  { name: "충북", slug: "chungbuk", areaCode: "33", aliases: ["충청북도", "충북"] },
  { name: "충남", slug: "chungnam", areaCode: "34", aliases: ["충청남도", "충남"] },
  { name: "경북", slug: "gyeongbuk", areaCode: "35", aliases: ["경상북도", "경북"] },
  { name: "경남", slug: "gyeongnam", areaCode: "36", aliases: ["경상남도", "경남"] },
  { name: "전북", slug: "jeonbuk", areaCode: "37", aliases: ["전북특별자치도", "전라북도", "전북"] },
  { name: "전남", slug: "jeonnam", areaCode: "38", aliases: ["전라남도", "전남"] },
  { name: "제주", slug: "jeju", areaCode: "39", aliases: ["제주특별자치도", "제주도", "제주"] },
];

const byAreaCode = new Map(REGIONS.map((r) => [r.areaCode, r]));
const bySlug = new Map(REGIONS.map((r) => [r.slug, r]));
const byName = new Map(REGIONS.map((r) => [r.name, r]));
const byAlias = new Map<string, Region>();
for (const r of REGIONS) for (const a of r.aliases) byAlias.set(a, r);

export function regionByAreaCode(code: string | undefined): Region | undefined {
  return code ? byAreaCode.get(String(code)) : undefined;
}
export function regionBySlug(slug: string): Region | undefined {
  return bySlug.get(slug);
}
export function regionByName(name: string): Region | undefined {
  return byName.get(name);
}

/**
 * 주소 문자열에서 시도/시군구 추출.
 * "강원특별자치도 강릉시 경포로 365" → { sido: "강원", sigungu: "강릉시" }
 * 주소로 알 수 없으면 areaCode 로 보완.
 */
export function parseAddress(
  addr: string | undefined,
  areaCode?: string,
): { sido: string; sigungu: string } {
  const tokens = (addr ?? "").trim().split(/\s+/).filter(Boolean);
  const first = tokens[0] ?? "";
  const region = byAlias.get(first) ?? regionByAreaCode(areaCode);
  const sido = region?.name ?? "";
  // 시도명이 주소 첫 단어였으면 두 번째 단어가 시군구, 아니면 첫 단어를 시군구로 간주
  const sigungu = byAlias.has(first) ? (tokens[1] ?? "") : first;
  return { sido, sigungu: sigungu.replace(/,$/, "") };
}
