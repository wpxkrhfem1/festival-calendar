/**
 * 카테고리 태그 자동 분류
 * - 축제명 + 개요 텍스트에서 키워드를 찾아 태그를 부여한다 (복수 가능)
 * - 계절 태그는 시작 월 기준으로 항상 하나 붙는다
 */
import type { Tag } from "./types";
import { seasonOfMonth } from "./date";

export type CategoryTag = Exclude<Tag, "봄" | "여름" | "가을" | "겨울">;

/** 키워드 사전 */
export const TAG_KEYWORDS: Record<CategoryTag, string[]> = {
  "먹거리": [
    "대하", "전어", "김치", "한우", "굴", "딸기", "막걸리", "먹거리", "음식", "미식", "맛",
    "빵", "커피", "치킨", "맥주", "와인", "주꾸미", "쭈꾸미", "꽃게", "새우", "송어", "빙어",
    "산천어", "명태", "고등어", "오징어", "멸치", "장어", "게장", "한과", "떡", "국수", "라면",
    "인삼", "고추", "마늘", "양파", "사과", "포도", "복숭아", "고구마", "감자",
    "옥수수", "약초", "버섯", "산나물", "메밀", "청국장", "된장", "장류", "전통주",
    "수산물", "먹방", "푸드", "food", "야시장",
  ],
  "불꽃/야경": [
    "불꽃", "빛", "등불", "야간", "야경", "루미나리에", "조명", "라이트", "달빛", "별빛",
    "폭죽", "드론쇼", "드론 쇼", "일루미네이션", "등축제", "연등",
  ],
  "꽃/자연": [
    "벚꽃", "유채", "튤립", "단풍", "억새", "눈꽃", "꽃", "매화", "장미", "연꽃", "코스모스",
    "국화", "철쭉", "진달래", "해바라기", "라벤더", "수국", "동백", "갈대", "숲", "정원",
    "생태", "해변", "갯벌", "습지", "계곡", "눈썰매", "얼음",
  ],
  "문화/전통": [
    "문화", "전통", "역사", "민속", "탈춤", "왕", "궁", "성곽", "한복", "국악", "서원", "향교",
    "제례", "줄다리기", "농악", "풍물", "세시", "정월", "대보름", "단오", "한가위", "추석",
    "선비", "고려", "조선", "신라", "백제", "가야", "탐라", "독립", "의병", "무형유산",
    "문화유산", "문화재", "향토",
  ],
  "음악/공연": [
    "뮤직", "페스티벌", "락", "록", "재즈", "콘서트", "음악", "공연", "댄스", "힙합", "EDM",
    "밴드", "오케스트라", "합창", "버스킹", "뮤지컬", "연극", "마당극", "예술제", "아트",
    "서커스", "거리극", "K-POP", "케이팝", "트로트", "가요",
  ],
};

/** "페스티벌"처럼 너무 넓은 키워드는 단독으로 음악/공연 태그를 주지 않는다 */
const WEAK_MUSIC_KEYWORDS = new Set(["페스티벌", "예술제", "아트"]);

/** 텍스트에서 키워드 포함 여부 (대소문자 무시) */
function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

/**
 * 태그 분류. 축제명은 강한 신호, 개요는 약한 신호로 취급한다.
 * - 축제명에 키워드 → 즉시 부여
 * - 개요에만 키워드 → 개요 앞 300자에서 발견될 때만 부여 (뒷부분은 부수 정보가 많음)
 */
export function classifyTags(title: string, overview: string, startDate: string): Tag[] {
  const tags = new Set<Tag>();
  const head = (overview ?? "").slice(0, 300);

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS) as [CategoryTag, string[]][]) {
    if (includesAny(title, keywords) || includesAny(head, keywords)) tags.add(tag);
  }

  if (tags.has("음악/공연")) {
    const strong = TAG_KEYWORDS["음악/공연"].filter((k) => !WEAK_MUSIC_KEYWORDS.has(k));
    if (!includesAny(title, strong) && !includesAny(head, strong)) tags.delete("음악/공연");
  }

  // 시작 월 기준 계절 태그
  const month = Number(startDate.slice(5, 7));
  if (month >= 1 && month <= 12) tags.add(seasonOfMonth(month));

  return [...tags];
}

/** 태그별 플레이스홀더 이미지 경로 (public/placeholder) */
export function placeholderFor(tags: Tag[]): string {
  if (tags.includes("먹거리")) return "/placeholder/food.svg";
  if (tags.includes("불꽃/야경")) return "/placeholder/light.svg";
  if (tags.includes("꽃/자연")) return "/placeholder/nature.svg";
  if (tags.includes("음악/공연")) return "/placeholder/music.svg";
  if (tags.includes("문화/전통")) return "/placeholder/culture.svg";
  return "/placeholder/default.svg";
}

/** UI 필터에 노출할 카테고리 태그 목록 (계절 제외) */
export const CATEGORY_TAGS: CategoryTag[] = ["먹거리", "불꽃/야경", "꽃/자연", "문화/전통", "음악/공연"];
export const SEASON_TAGS: Tag[] = ["봄", "여름", "가을", "겨울"];
