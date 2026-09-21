import { OG_CONTENT_TYPE, OG_SIZE, OgCard, renderOg } from "@/lib/og";
import { getFestivalsByRegionSlug } from "@/lib/festivals";
import { regionBySlug } from "@/lib/regions";
import { SITE_NAME } from "@/lib/site";

export const alt = "지역별 축제";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 지역 페이지 OG 이미지 */
export default async function Image({ params }: { params: Promise<{ sido: string }> }) {
  const { sido } = await params;
  const region = regionBySlug(sido);
  const festivals = getFestivalsByRegionSlug(sido);
  const title = `${region?.name ?? ""} 축제 총정리`;
  const subtitle = `${region?.aliases[0] ?? ""} 축제 ${festivals.length}개를 월별로`;
  const withImage = festivals.find((f) => /^https?:\/\/tong\.visitkorea\.or\.kr\//.test(f.image));
  return renderOg(<OgCard eyebrow={SITE_NAME} title={title} subtitle={subtitle} image={withImage?.image} />, SITE_NAME + title + subtitle);
}
