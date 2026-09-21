/**
 * 축제 데이터 타입 정의
 * - RawFestivalItem : TourAPI 4.0 searchFestival2 응답 항목 (필요한 필드만)
 * - RawDetailCommon : detailCommon2 응답 항목
 * - RawDetailIntro  : detailIntro2 (contentTypeId=15) 응답 항목
 * - Festival        : 사이트에서 사용하는 정규화된 형태 (data/festivals.json 저장 단위)
 */

/** 카테고리 태그 (자동 분류) */
export type Tag =
  | "먹거리"
  | "불꽃/야경"
  | "꽃/자연"
  | "문화/전통"
  | "음악/공연"
  | "봄"
  | "여름"
  | "가을"
  | "겨울";

/** searchFestival2 응답 item */
export interface RawFestivalItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  eventstartdate: string; // YYYYMMDD
  eventenddate: string; // YYYYMMDD
  addr1?: string;
  addr2?: string;
  areacode?: string;
  sigungucode?: string;
  lDongRegnCd?: string;
  lDongSignguCd?: string;
  firstimage?: string;
  firstimage2?: string;
  tel?: string;
  mapx?: string;
  mapy?: string;
  modifiedtime?: string; // YYYYMMDDHHmmss
  createdtime?: string;
  progresstype?: string;
  festivaltype?: string;
}

/** detailCommon2 응답 item */
export interface RawDetailCommon {
  contentid: string;
  title?: string;
  homepage?: string; // HTML 앵커 태그가 섞여 들어옴
  overview?: string; // HTML 태그가 섞여 들어옴
  tel?: string;
  addr1?: string;
  addr2?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
}

/** detailIntro2 (contentTypeId=15) 응답 item */
export interface RawDetailIntro {
  contentid: string;
  eventplace?: string; // 행사 장소
  playtime?: string; // 공연 시간
  usetimefestival?: string; // 이용 요금
  sponsor1?: string; // 주최
  sponsor1tel?: string;
  sponsor2?: string; // 주관
  eventhomepage?: string;
  program?: string;
  agelimit?: string;
}

/** 정규화된 축제 (festivals.json 저장 단위) */
export interface Festival {
  /** TourAPI contentid */
  id: string;
  title: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  /** 시도 짧은 이름 (서울, 경기, 강원 ...) */
  sido: string;
  /** 시군구 (주소에서 파싱) */
  sigungu: string;
  address: string;
  image: string;
  thumbnail: string;
  tel: string;
  homepage: string;
  /** 개요 전문 (HTML 제거) */
  overview: string;
  tags: Tag[];
  /** 걸쳐 있는 모든 달. "YYYY-MM" 형식 */
  months: string[];
  /** 부가 정보 (detailIntro2) */
  place?: string;
  playtime?: string;
  fee?: string;
  sponsor?: string;
  /** 프로그램 안내 (detailIntro2.program) */
  program?: string;
  /** 추가 사진 (detailImage2). 대표 이미지와 중복되는 건 제외 */
  photos?: string[];
  /** 지도 좌표 (WGS84) */
  lng?: number;
  lat?: number;
  /** API modifiedtime (변경 감지용) */
  modifiedTime?: string;
}

/** festivals.json 파일 구조 */
export interface FestivalDataFile {
  meta: {
    fetchedAt: string;
    rangeStart: string;
    rangeEnd: string;
    count: number;
    source: string;
  };
  festivals: Festival[];
}

/** overrides.json 항목: id 필수, 나머지는 선택 (hidden: true 면 목록에서 제외) */
export type FestivalOverride = Partial<Festival> & { id: string; hidden?: boolean };

/* ────────────────────────────────────────────────────────────
 * 공연 (KOPIS 공연예술통합전산망)
 * 축제와 데이터원·성격이 달라 타입을 따로 둔다.
 * ──────────────────────────────────────────────────────────── */

/** 공연 장르 (KOPIS genrenm 을 그대로 쓴다) */
export type Genre =
  | "연극"
  | "뮤지컬"
  | "서양음악(클래식)"
  | "한국음악(국악)"
  | "대중음악"
  | "무용(서양/한국무용)"
  | "대중무용"
  | "서커스/마술"
  | "복합";

/** 공연 상태 */
export type ConcertState = "공연예정" | "공연중" | "공연완료";

/** KOPIS 공연목록(pblprfr) 응답 항목 */
export interface RawKopisListItem {
  mt20id: string;
  prfnm: string;
  prfpdfrom: string; // YYYY.MM.DD
  prfpdto: string;
  fcltynm: string;
  poster?: string;
  area?: string;
  genrenm?: string;
  openrun?: string; // Y/N
  prfstate?: string;
}

/** KOPIS 공연상세(pblprfr/{id}) 응답 항목 */
export interface RawKopisDetail extends RawKopisListItem {
  mt10id?: string;
  prfcast?: string; // 출연진
  prfcrew?: string; // 제작진
  prfruntime?: string; // 러닝타임
  prfage?: string; // 관람연령
  entrpsnm?: string; // 기획제작사
  entrpsnmH?: string; // 주최
  entrpsnmS?: string; // 주관
  pcseguidance?: string; // 티켓 가격
  dtguidance?: string; // 공연시간 안내
  sty?: string; // 소개
  updatedate?: string;
  styurls?: { styurl?: string | string[] };
  relates?: { relate?: RawKopisRelate | RawKopisRelate[] };
}

export interface RawKopisRelate {
  relatenm?: string; // 예매처 이름
  relateurl?: string; // 예매 링크
}

/** 예매처 링크 */
export interface TicketLink {
  name: string;
  url: string;
}

/** 정규화된 공연 (data/concerts.json 저장 단위) */
export interface Concert {
  /** KOPIS mt20id (예: PF301330) */
  id: string;
  title: string;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  genre: string;
  /** 공연장 이름 */
  venue: string;
  /** 시도 짧은 이름 (서울, 경기 ...) */
  sido: string;
  poster: string;
  /** 상시 공연(오픈런) 여부 */
  openRun: boolean;
  state: string;
  /** 걸쳐 있는 모든 달. "YYYY-MM" */
  months: string[];
  /** 아래는 상세 조회로만 채워진다 */
  cast?: string;
  crew?: string;
  runtime?: string;
  ageLimit?: string;
  price?: string;
  timeGuide?: string;
  producer?: string;
  /** 소개 이미지 URL 목록 */
  introImages?: string[];
  /** 예매처 링크 */
  tickets?: TicketLink[];
  /** KOPIS updatedate (변경 감지용) */
  updatedAt?: string;
}

/** concerts.json 파일 구조 */
export interface ConcertDataFile {
  meta: {
    fetchedAt: string;
    rangeStart: string;
    rangeEnd: string;
    count: number;
    detailCount: number;
    source: string;
  };
  concerts: Concert[];
}
