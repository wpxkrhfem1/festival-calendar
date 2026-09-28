import { renderAppIcon } from "@/lib/og";

/** 홈 화면 아이콘 192px → /app-icon-192.png (빌드 때 한 번 굽는다) */
export const dynamic = "force-static";

export async function GET() {
  return renderAppIcon(192);
}
