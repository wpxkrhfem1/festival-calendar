import { isLongRunning } from "./date";

/**
 * 정적 파일 경로와 외부 이미지 주소를 다듬는다.
 *
 * GitHub Pages 는 저장소 이름이 경로에 붙는다(/festival-calendar). Next 의
 * basePath 가 링크에는 자동으로 붙지만, images.unoptimized 로 내보낸 <Image>
 * 의 src 에는 붙지 않는다. 그래서 public/ 아래 파일은 직접 붙여야 한다.
 * 실제로 이걸 빼먹어 카테고리·장르 아이콘이 통째로 안 떴다.
 */

/** 배포 경로 접두사 (로컬에서는 빈 문자열) */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** public/ 아래 파일 경로에 배포 접두사를 붙인다 */
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * 외부 이미지 주소를 https 로 올린다.
 *
 * KOPIS 포스터는 전부 http:// 로 온다. 이미지 최적화 서버가 있을 때는 그쪽이
 * 대신 받아다 줘서 문제가 없었지만, 원본을 직접 불러오는 지금은 https 페이지에서
 * http 이미지가 막힌다(혼합 콘텐츠).
 *
 * 확인해 보니 두 이미지 서버 모두 https 를 지원한다.
 * KOPIS 는 www 가 붙은 주소가 www 없는 쪽으로 넘기므로 아예 처음부터 그쪽을 쓴다.
 */
export function secureImage(url: string): string {
  if (!url) return url;
  if (url.startsWith("https://")) return url;
  if (!url.startsWith("http://")) return url;

  const bare = url.slice("http://".length);
  // www.kopis.or.kr → kopis.or.kr (https 로 가면 어차피 여기로 넘어간다)
  if (bare.startsWith("www.kopis.or.kr/")) return `https://${bare.slice("www.".length)}`;
  return `https://${bare}`;
}

/**
 * 사이트 기본 공유 이미지 (app/og.png/route.tsx 가 빌드 때 굽는다).
 * 확장자가 붙어 있어야 GitHub Pages 가 image/png 로 내보낸다.
 */
export function defaultOgImage(siteUrl: string): string {
  return `${siteUrl}/og.png`;
}

/**
 * 목록 페이지(월·지역·테마)를 공유할 때 쓸 대표 사진.
 *
 * 정적 사이트로 옮기면서 이 페이지들의 동적 공유 이미지를 지웠더니
 * 카카오톡에 "10월 축제" 링크를 보내면 사진 없이 글자만 나갔다.
 * 목록 안에서 사진이 있는 첫 축제를 쓰고, 하나도 없으면 사이트 기본 이미지를 쓴다.
 */
export function pickShareImage(
  items: { image?: string; startDate?: string; endDate?: string }[],
  siteUrl: string,
): string {
  const withImage = items.filter((x) => !!x.image);
  // 연중 상설(120일 넘게 이어지는 것)은 뒤로 미룬다. 목록이 시작일 순이라
  // 2022년부터 하는 상설 공연 사진이 "10월 축제" 와 "서울 축제" 를 똑같이 대표하고 있었다
  const seasonal = withImage.find((x) => !(x.startDate && x.endDate && isLongRunning(x.startDate, x.endDate)));
  const found = seasonal ?? withImage[0];
  return found?.image ? secureImage(found.image) : defaultOgImage(siteUrl);
}
