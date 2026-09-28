import { renderAppIcon } from "@/lib/og";

/** 홈 화면 아이콘 512px → /app-icon-512.png (빌드 때 한 번 굽는다) */
export const dynamic = "force-static";

export async function GET() {
  return renderAppIcon(512);
}
