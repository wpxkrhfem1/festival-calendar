import { renderAppIcon } from "@/lib/og";

/**
 * 아이폰 홈 화면 아이콘 180px → /apple-touch-icon.png
 * 사파리는 웹 앱 매니페스트의 아이콘을 쓰지 않고 이것만 본다.
 */
export const dynamic = "force-static";

export async function GET() {
  return renderAppIcon(180);
}
