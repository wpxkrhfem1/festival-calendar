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
  /** 법정동 시도 코드 (lDongRegnCd). 강원·전북은 특별자치도 전환 전후 코드가 둘 다 쓰인다 */
  ldongCodes: string[];
  /** 주소 첫 단어로 등장하는 정식/구 명칭들 */
  aliases: string[];
}

export const REGIONS: Region[] = [
  { name: "서울", slug: "seoul", areaCode: "1", ldongCodes: ["11"], aliases: ["서울특별시", "서울시", "서울"] },
  { name: "인천", slug: "incheon", areaCode: "2", ldongCodes: ["28"], aliases: ["인천광역시", "인천시", "인천"] },
  { name: "대전", slug: "daejeon", areaCode: "3", ldongCodes: ["30"], aliases: ["대전광역시", "대전시", "대전"] },
  { name: "대구", slug: "daegu", areaCode: "4", ldongCodes: ["27"], aliases: ["대구광역시", "대구시", "대구"] },
  { name: "광주", slug: "gwangju", areaCode: "5", ldongCodes: ["29"], aliases: ["광주광역시", "광주시", "광주"] },
  { name: "부산", slug: "busan", areaCode: "6", ldongCodes: ["26"], aliases: ["부산광역시", "부산시", "부산"] },
  { name: "울산", slug: "ulsan", areaCode: "7", ldongCodes: ["31"], aliases: ["울산광역시", "울산시", "울산"] },
  { name: "세종", slug: "sejong", areaCode: "8", ldongCodes: ["36"], aliases: ["세종특별자치시", "세종시", "세종"] },
  { name: "경기", slug: "gyeonggi", areaCode: "31", ldongCodes: ["41"], aliases: ["경기도", "경기"] },
  { name: "강원", slug: "gangwon", areaCode: "32", ldongCodes: ["42","51"], aliases: ["강원특별자치도", "강원도", "강원"] },
  { name: "충북", slug: "chungbuk", areaCode: "33", ldongCodes: ["43"], aliases: ["충청북도", "충북"] },
  { name: "충남", slug: "chungnam", areaCode: "34", ldongCodes: ["44"], aliases: ["충청남도", "충남"] },
  { name: "경북", slug: "gyeongbuk", areaCode: "35", ldongCodes: ["47"], aliases: ["경상북도", "경북"] },
  { name: "경남", slug: "gyeongnam", areaCode: "36", ldongCodes: ["48"], aliases: ["경상남도", "경남"] },
  { name: "전북", slug: "jeonbuk", areaCode: "37", ldongCodes: ["45","52"], aliases: ["전북특별자치도", "전라북도", "전북"] },
  { name: "전남", slug: "jeonnam", areaCode: "38", ldongCodes: ["46"], aliases: ["전라남도", "전남"] },
  { name: "제주", slug: "jeju", areaCode: "39", ldongCodes: ["50"], aliases: ["제주특별자치도", "제주도", "제주"] },
];

const byAreaCode = new Map(REGIONS.map((r) => [r.areaCode, r]));
const bySlug = new Map(REGIONS.map((r) => [r.slug, r]));
const byName = new Map(REGIONS.map((r) => [r.name, r]));
const byAlias = new Map<string, Region>();
for (const r of REGIONS) for (const a of r.aliases) byAlias.set(a, r);
const byLdong = new Map<string, Region>();
for (const r of REGIONS) for (const c of r.ldongCodes) byLdong.set(c, r);

export function regionByAreaCode(code: string | undefined): Region | undefined {
  return code ? byAreaCode.get(String(code)) : undefined;
}
export function regionByLdongCode(code: string | undefined): Region | undefined {
  return code ? byLdong.get(String(code)) : undefined;
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
 * 주소로 알 수 없으면 areaCode → lDongRegnCd 순으로 보완.
 * (실제 API 응답은 areacode 가 비어 있고 lDongRegnCd 만 오는 경우가 많다)
 */
export function parseAddress(
  addr: string | undefined,
  areaCode?: string,
  ldongCode?: string,
): { sido: string; sigungu: string } {
  const tokens = (addr ?? "").trim().split(/\s+/).filter(Boolean);
  const first = tokens[0] ?? "";
  const second = (tokens[1] ?? "").replace(/,$/, "");

  // 통합 광역단체: 시군구 이름으로 원래 시도를 되찾는다 (2026년 API 응답에서 실제로 등장)
  const merged = MERGED_REGIONS[first];
  if (merged) {
    const region = merged.cityDistricts.has(second) ? byName.get(merged.city)! : byName.get(merged.province)!;
    return { sido: region.name, sigungu: second };
  }

  const region = byAlias.get(first) ?? regionByAreaCode(areaCode) ?? regionByLdongCode(ldongCode);
  const sido = region?.name ?? "";
  // 시도명이 주소 첫 단어였으면 두 번째 단어가 시군구, 아니면 첫 단어를 시군구로 간주
  const sigungu = byAlias.has(first) ? second : first;
  return { sido, sigungu: sigungu.replace(/,$/, "") };
}

/**
 * 광역시 + 도가 합쳐진 통합특별시 주소. 구(區) 이름이면 옛 광역시, 아니면 옛 도로 매핑한다.
 * 예) "전남광주통합특별시 남구" → 광주, "전남광주통합특별시 여수시" → 전남
 */
const MERGED_REGIONS: Record<string, { city: string; province: string; cityDistricts: Set<string> }> = {
  전남광주통합특별시: {
    city: "광주",
    province: "전남",
    cityDistricts: new Set(["동구", "서구", "남구", "북구", "광산구"]),
  },
};
