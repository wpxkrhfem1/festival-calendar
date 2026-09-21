import { OG_CONTENT_TYPE, OG_SIZE, OgCard, renderOg } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";
import { todayKST, parseDate } from "@/lib/date";

export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 홈 OG 이미지 */
export default async function Image() {
  const { year } = parseDate(todayKST());
  const title = "이번 달 전국 축제 한눈에";
  const subtitle = `${year} 1월부터 12월까지, 지역·카테고리별 축제 달력`;
  return renderOg(<OgCard eyebrow={SITE_NAME} title={title} subtitle={subtitle} />, title + subtitle + SITE_NAME);
}
