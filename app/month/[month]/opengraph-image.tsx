import { OG_CONTENT_TYPE, OG_SIZE, OgCard, renderOg } from "@/lib/og";
import { getFestivalsByMonth, pickMonthYear } from "@/lib/festivals";
import { todayKST } from "@/lib/date";
import { SITE_NAME } from "@/lib/site";

export const alt = "월별 축제 총정리";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 월 페이지 OG 이미지 */
export default async function Image({ params }: { params: Promise<{ month: string }> }) {
  const month = Number((await params).month);
  const result = getFestivalsByMonth(month, todayKST());
  const year = result.defaultYear;
  const festivals = pickMonthYear(result, year)?.festivals ?? [];
  const withImage = festivals.find((f) => /^https?:\/\/tong\.visitkorea\.or\.kr\//.test(f.image));
  const title = `${month}월 축제 총정리`;
  const subtitle = festivals.length ? `전국 축제 ${festivals.length}개 · ${festivals.slice(0, 2).map((f) => f.title).join(", ")}` : "전국 축제 일정";
  const eyebrow = `${SITE_NAME} ${year}`;
  return renderOg(<OgCard eyebrow={eyebrow} title={title} subtitle={subtitle} image={withImage?.image} />, eyebrow + title + subtitle);
}
