/**
 * 카테고리 태그 자동 분류
 *
 * 핵심 규칙: **축제명에서만** 키워드를 찾는다.
 *
 * 처음에는 개요 본문에서도 찾았는데, 거의 모든 축제 소개글에 "먹거리",
 * "음식", "공연" 같은 말이 들어가서 경복궁 별빛야행이 먹거리로 잡히는 식의
 * 오분류가 쏟아졌다. 실측으로 확인한 문제다.
 *
 * 축제는 성격을 이름에 담는다. "대하축제", "벚꽃축제", "불꽃축제" 처럼.
 * 그래서 이름만 보는 쪽이 훨씬 정확하다.
 * 다만 이름만으로는 알기 어려운 몇 가지는 개요에서도 찾는다(OVERVIEW_OK).
 */
import type { Tag } from "./types";
import { seasonOfMonth } from "./date";

export type CategoryTag = Exclude<Tag, "봄" | "여름" | "가을" | "겨울">;

/** 축제명에서 찾는 키워드 */
export const TAG_KEYWORDS: Record<CategoryTag, string[]> = {
  "먹거리": [
    // 해산물
    "대하", "전어", "굴", "꽃게", "새우", "송어", "빙어", "산천어", "명태", "고등어",
    "오징어", "멸치", "장어", "게장", "주꾸미", "쭈꾸미", "물회", "회센터", "활어", "수산물", "어시장",
    "젓갈", "김치", "김밥", "김장", "미역", "다슬기", "재첩", "메기", "붕어", "숭어", "가리비", "조개",
    // 농산물·특산물
    "한우", "딸기", "인삼", "고추", "마늘", "양파", "사과", "포도", "복숭아",
    "고구마", "감자", "옥수수", "버섯", "산나물", "약초", "한방", "곶감", "대추", "알밤",
    "배축제", "수박", "참외", "토마토", "블루베리", "오미자", "유자", "매실", "녹차", "쌀",
    "한과", "떡", "국수", "빵", "커피", "치즈", "삼겹살", "닭", "오리", "흑돼지",
    // 술·가공식품
    "막걸리", "전통주", "와인", "맥주", "청국장", "된장", "장류", "젓갈",
    "송이", "산삼", "율무", "오곡", "약수",
    // 요리·가공식품
    "짬뽕", "라면", "삼계탕", "바비큐", "디저트", "브로이", "옥토버페스트",
    // 먹거리임을 이름에 밝힌 경우
    "먹거리", "미식", "별미", "장터", "주막", "포구", "항구", "파시", "food", "푸드",
  ],
  "불꽃/야경": [
    "불꽃", "빛", "등불", "야경", "야행", "루미나리에", "조명", "달빛", "별빛",
    "폭죽", "드론쇼", "드론 쇼", "일루미네이션", "등축제", "연등", "유등", "야연", "야간", "밤의", "라이트쇼", "라이트 쇼",
    "노을", "나잇", "night",
  ],
  "꽃/자연": [
    "벚꽃", "유채", "튤립", "단풍", "억새", "눈꽃", "꽃", "매화", "장미", "연꽃",
    "코스모스", "국화", "철쭉", "진달래", "해바라기", "라벤더", "수국", "동백", "갈대",
    "정원", "생태", "숲", "해변", "갯벌", "습지", "계곡", "눈썰매", "얼음", "가든", "천일홍", "구절초", "메밀꽃", "연꽃", "백일홍",
    "플라워", "수련", "적벽", "올레", "걷기", "트레킹", "둘레길", "flower",
  ],
  "문화/전통": [
    // "문화" 한 단어는 쓰지 않는다. 지역축제 대부분이 "○○문화제" 라 전부 걸린다
    "전통문화", "문화유산", "문화재", "무형유산", "민속", "전통",
    // 전통 연희·예술
    "탈춤", "탈놀이", "국악", "농악", "풍물", "사물놀이", "판소리", "남사당", "연희",
    "아리랑", "줄다리기", "강강술래", "씨름", "한복", "한지", "도자", "옹기", "서예",
    // 궁궐·유적
    "경복궁", "창덕궁", "덕수궁", "창경궁", "경희궁", "행궁", "궁중", "왕궁", "종묘",
    "서원", "향교", "한옥", "성곽", "수문장", "봉수", "제례", "파수", "숭례문",
    "수원화성", "읍성", "왕릉", "고인돌", "도자기", "질그릇",
    "선사", "산성", "능행차", "삼국유사", "세종대왕", "심청", "역사탐방", "수문장",
    // 세시·역사
    "세시", "정월", "대보름", "단오", "한가위", "설날", "선비", "고려", "조선",
    "신라", "백제", "가야", "탐라", "독립", "의병", "삼일절", "한글",
  ],
  "전시/예술": [
    "비엔날레", "미술", "전시", "기획전", "사진제", "사진전", "영화제", "미디어아트",
    "예술제", "아트", "공예", "디자인", "건축", "조각", "회화", "갤러리", "박람회",
    "도서관", "책", "문학", "시화", "서예",
    "일러스트", "독서", "영화", "미디어", "exhibition", "아트페어",
  ],
  "음악/공연": [
    "뮤직", "락", "록", "재즈", "콘서트", "음악", "공연", "댄스", "힙합", "EDM",
    "밴드", "오케스트라", "합창", "버스킹", "뮤지컬", "연극", "마당극", "서커스",
    "피아노", "기타", "국제음악", "관현악", "실내악",
    "거리극", "K-POP", "케이팝", "트로트", "가요", "라이브", "노래", "춤", "타령", "풍류", "판소리",
    "발레", "소극장", "퍼포먼스", "국립극장", "청춘마이크",
  ],
};

/**
 * 개요에서도 찾아도 되는 키워드.
 * 본문에 나오면 그 축제의 성격이라고 봐도 되는 구체적인 말만 둔다.
 */
const OVERVIEW_OK: Partial<Record<CategoryTag, string[]>> = {
  "불꽃/야경": ["불꽃놀이", "야간개장", "야간 개장"],
  "문화/전통": ["무형문화유산", "국가무형문화재"],
};

/**
 * 헷갈리는 조합. 왼쪽 말이 오른쪽 말의 일부로 나오면 그 태그를 주지 않는다.
 * 예) "메밀꽃축제" 는 꽃 축제지 먹거리가 아니다.
 */
const EXCLUDE: { tag: CategoryTag; keyword: string; when: string[] }[] = [
  // 지명·인명에 음식 이름이 들어가는 경우
  { tag: "먹거리", keyword: "김치", when: [] },
  { tag: "꽃/자연", keyword: "꽃", when: ["불꽃", "꽃가마"] },
  // 금-산삼-계탕. 삼계탕 축제라 먹거리는 맞지만 "산삼" 으로 잡히면 안 된다
  { tag: "먹거리", keyword: "산삼", when: ["금산삼계탕"] },
  // 허-심청. 스파 이름이지 심청전이 아니다
  { tag: "문화/전통", keyword: "심청", when: ["허심청"] },
];

function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

/** 제외 규칙에 걸리는지. 키워드가 오직 제외 문맥으로만 등장하면 true */
function blocked(title: string, tag: CategoryTag, keyword: string): boolean {
  const rule = EXCLUDE.find((e) => e.tag === tag && e.keyword === keyword);
  if (!rule) return false;
  // 키워드가 제외 문맥 밖에서도 나오면 막지 않는다
  let rest = title;
  for (const w of rule.when) rest = rest.split(w).join("");
  return !rest.includes(keyword);
}

/**
 * 태그 분류.
 * 축제명에서 키워드를 찾고, 일부 카테고리만 개요도 함께 본다.
 * 계절 태그는 시작 월 기준으로 항상 하나 붙는다.
 */
export function classifyTags(title: string, overview: string, startDate: string): Tag[] {
  const tags = new Set<Tag>();
  const name = title ?? "";
  const head = (overview ?? "").slice(0, 400);

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS) as [CategoryTag, string[]][]) {
    const hit = keywords.find((k) => name.toLowerCase().includes(k.toLowerCase()) && !blocked(name, tag, k));
    if (hit) {
      tags.add(tag);
      continue;
    }
    const extra = OVERVIEW_OK[tag];
    if (extra && includesAny(head, extra)) tags.add(tag);
  }

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
  if (tags.includes("전시/예술")) return "/placeholder/art.svg";
  return "/placeholder/default.svg";
}

/**
 * 테마 랜딩 페이지 정의.
 *
 * /browse 와 /search 는 조합이 많아 noindex 라서, "10월 불꽃축제" 같은 말로
 * 검색해 들어올 입구가 월 페이지와 지역 페이지밖에 없었다.
 * 카테고리마다 고정 주소를 하나씩 만들어 색인되게 한다.
 *
 * intro 는 손으로 쓴다. 목록만 있는 얇은 페이지는 검색에서 밀린다.
 */
export interface Theme {
  slug: string;
  tag: CategoryTag;
  /** h1 과 title 에 쓰는 이름 */
  name: string;
  /** 페이지 첫 문단 */
  intro: string;
}

export const THEMES: Theme[] = [
  {
    slug: "food",
    tag: "먹거리",
    name: "먹거리 축제",
    intro:
      "제철 재료가 가장 좋을 때, 그 재료가 나는 고장에서 열리는 축제들이다. 봄에는 딸기와 주꾸미, 여름에는 옥수수와 산나물, 가을에는 대하·전어·송이, 겨울에는 굴과 빙어가 제철이다. 산지에서 바로 먹는 값이라 도시 식당보다 싸고, 대부분 현장에서 사서 그 자리에서 구워 먹는 방식이다.",
  },
  {
    slug: "night",
    tag: "불꽃/야경",
    name: "불꽃·야경 축제",
    intro:
      "해가 지고 나서 시작하는 축제들이다. 불꽃놀이와 드론쇼, 등(燈) 축제, 고궁 야간개장, 빛 조형물 전시가 여기 들어간다. 낮 축제와 달리 끝나는 시간이 정해져 있고 사람이 몰리는 시간대가 뚜렷하니, 시작 한 시간 전쯤 자리를 잡는 편이 낫다.",
  },
  {
    slug: "nature",
    tag: "꽃/자연",
    name: "꽃·자연 축제",
    intro:
      "꽃이 피는 시기에 맞춰 열리는 축제라 날짜가 해마다 조금씩 움직인다. 벚꽃·유채는 3~4월, 장미·수국은 5~6월, 해바라기·코스모스는 8~9월, 단풍과 억새는 10~11월이 절정이다. 개화 시기는 그해 기온에 따라 일주일쯤 앞뒤로 밀리니 출발 전에 공식 홈페이지를 한 번 확인하는 게 좋다.",
  },
  {
    slug: "culture",
    tag: "문화/전통",
    name: "문화·전통 축제",
    intro:
      "그 고장의 역사와 전통 연희를 주제로 하는 축제들이다. 탈춤·농악·판소리 같은 전통 공연, 고궁과 읍성·서원에서 열리는 행사, 세시풍속 재현이 여기 속한다. 관람만 하는 것보다 체험 프로그램이 많아 아이와 함께 가기 좋은 축제가 많다.",
  },
  {
    slug: "music",
    tag: "음악/공연",
    name: "음악·공연 축제",
    intro:
      "야외 무대에서 열리는 음악 축제와 거리 공연, 연극·뮤지컬 페스티벌이다. 록·재즈·EDM 같은 대형 페스티벌은 대개 여름에 몰리고, 국악과 클래식은 가을에 많다. 티켓이 필요한 축제와 무료 야외 공연이 섞여 있으니 요금 항목을 먼저 확인하면 좋다.",
  },
  {
    slug: "art",
    tag: "전시/예술",
    name: "전시·예술 축제",
    intro:
      "비엔날레와 아트페어, 사진제·영화제, 미디어아트 전시가 여기 모인다. 하루짜리 행사가 아니라 몇 주에서 몇 달씩 이어지는 경우가 많아, 날짜를 맞추기보다 여행 일정에 끼워 넣기 좋은 축제들이다.",
  },
];

export function themeBySlug(slug: string): Theme | undefined {
  return THEMES.find((t) => t.slug === slug);
}

/** UI 필터에 노출할 카테고리 태그 목록 (계절 제외) */
export const CATEGORY_TAGS: CategoryTag[] = ["먹거리", "불꽃/야경", "꽃/자연", "문화/전통", "음악/공연", "전시/예술"];
export const SEASON_TAGS: Tag[] = ["봄", "여름", "가을", "겨울"];
