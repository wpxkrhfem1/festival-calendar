import { OgCard, renderOg } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";
import { todayKST, parseDate } from "@/lib/date";

/**
 * 사이트 기본 공유 이미지 → /og.png
 *
 * 원래 app/opengraph-image.tsx (Next 의 파일 규칙) 로 만들었는데, 정적으로
 * 내보내면 파일 이름이 확장자 없는 "opengraph-image" 로 나온다. GitHub Pages 는
 * 확장자로 형식을 정하므로 이걸 application/octet-stream 으로 내보냈다.
 * 카카오톡·페이스북은 이미지가 아닌 형식을 무시해서 홈 공유 미리보기가 깨졌다.
 *
 * 그래서 이름에 .png 가 붙는 경로로 옮겼다. 빌드 때 한 번 구워지고
 * (force-static), 매일 다시 빌드하니 연도 문구도 따라 바뀐다.
 */
export const dynamic = "force-static";

export async function GET() {
  const { year } = parseDate(todayKST());
  const title = "이번 달 전국 축제 한눈에";
  const subtitle = `${year} 1월부터 12월까지, 지역·카테고리별 축제 달력`;
  return renderOg(<OgCard eyebrow={SITE_NAME} title={title} subtitle={subtitle} />, title + subtitle + SITE_NAME);
}
