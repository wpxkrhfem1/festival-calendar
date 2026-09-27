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
