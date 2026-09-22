/**
 * 목록 화면에 넘길 최소 데이터
 *
 * 찜 목록과 내 주변은 브라우저에만 있는 정보(localStorage, 위치)로 골라내야 해서
 * 서버가 미리 그릴 수 없다. 그래서 전체 목록을 통째로 넘기고 있었는데,
 * Festival/Concert 객체를 그대로 넘기다 보니 RSC 페이로드가 이렇게 나왔다.
 *
 *   /saved   4,326 KB   (축제 742 + 공연 2,585건 전부)
 *   /nearby  1,939 KB
 *
 * 헤더의 하트는 모든 페이지에 있고 Next 가 링크를 미리 받아두므로, 어느 페이지를
 * 열든 4MB 가 따라왔다. 홈 한 번에 프리페치만 9.3MB 였다.
 *
 * 정작 카드가 쓰는 필드는 9개뿐이다. overview(274KB), program(216KB),
 * photos(249KB), introImages(288KB) 는 상세 페이지에서만 쓰는데 딸려 나갔다.
 * 필드를 추리면 축제 80%, 공연 68% 가 줄어든다.
 *
 * 타입을 Pick 으로 잡아둬서 원본 Festival/Concert 를 그대로 넘겨도 형이 맞는다.
 * 월·지역 페이지처럼 이미 서버에서 걸러 보내는 화면은 손대지 않아도 된다.
 */
import type { Concert, Festival } from "./types";

/** 축제 카드 + 목록 필터(지역·태그) + 거리 계산에 필요한 만큼 */
export type FestivalCardData = Pick<
  Festival,
  "id" | "title" | "startDate" | "endDate" | "sido" | "sigungu" | "image" | "thumbnail" | "tags"
> &
  Pick<Festival, "lat" | "lng">;

/** 공연 카드 + 목록 필터(지역·장르)에 필요한 만큼 */
export type ConcertCardData = Pick<
  Concert,
  "id" | "title" | "startDate" | "endDate" | "sido" | "genre" | "venue" | "poster" | "openRun"
>;

export function toFestivalCard(f: Festival): FestivalCardData {
  return {
    id: f.id,
    title: f.title,
    startDate: f.startDate,
    endDate: f.endDate,
    sido: f.sido,
    sigungu: f.sigungu,
    image: f.image,
    thumbnail: f.thumbnail,
    tags: f.tags,
    lat: f.lat,
    lng: f.lng,
  };
}

export function toConcertCard(c: Concert): ConcertCardData {
  return {
    id: c.id,
    title: c.title,
    startDate: c.startDate,
    endDate: c.endDate,
    sido: c.sido,
    genre: c.genre,
    venue: c.venue,
    poster: c.poster,
    openRun: c.openRun,
  };
}
