import { OG_CONTENT_TYPE, OG_SIZE, OgCard, renderOg } from "@/lib/og";
import { getLiveFestivals } from "@/lib/festivals";
import { themeBySlug } from "@/lib/tags";
import { todayKST } from "@/lib/date";
import { SITE_NAME } from "@/lib/site";

export const alt = "테마별 축제";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * 테마 페이지 OG 이미지.
 *
 * 다른 페이지에는 다 있는데 이 페이지만 빠져 있어서, 카카오톡에 링크를 붙이면
 * 그림 없이 떴다. 테마 페이지가 검색·공유 유입을 맡을 자리라 더 그렇다.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = themeBySlug(slug);
  const list = getLiveFestivals(todayKST()).filter((f) => (theme ? f.tags.includes(theme.tag) : false));
  const title = `${theme?.name ?? "축제"} 총정리`;
  const subtitle = `지금 갈 수 있는 축제 ${list.length}개`;
  // 대표 이미지는 한국관광공사 서버 것만 쓴다 (OG 렌더러가 외부 도메인을 못 가져오면 통째로 실패한다)
  const withImage = list.find((f) => /^https?:\/\/tong\.visitkorea\.or\.kr\//.test(f.image));
  return renderOg(
    <OgCard eyebrow={SITE_NAME} title={title} subtitle={subtitle} image={withImage?.image} />,
    SITE_NAME + title + subtitle,
  );
}
