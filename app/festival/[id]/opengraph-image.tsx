import { OG_CONTENT_TYPE, OG_SIZE, OgCard, renderOg } from "@/lib/og";
import { getFestivalById } from "@/lib/festivals";
import { formatPeriod } from "@/lib/date";
import { SITE_NAME } from "@/lib/site";

export const alt = "축제 정보";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 축제 상세 OG 이미지: 대표 이미지가 있으면 오른쪽에 배치 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const f = getFestivalById((await params).id);
  const title = f?.title ?? SITE_NAME;
  const subtitle = f ? `${formatPeriod(f.startDate, f.endDate)} · ${[f.sido, f.sigungu].filter(Boolean).join(" ")}` : "";
  const image = f && /^https?:\/\/tong\.visitkorea\.or\.kr\//.test(f.image) ? f.image : undefined;
  return renderOg(<OgCard eyebrow={SITE_NAME} title={title} subtitle={subtitle} image={image} />, SITE_NAME + title + subtitle);
}
