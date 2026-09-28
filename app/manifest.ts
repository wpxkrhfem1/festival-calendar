import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { asset } from "@/lib/asset";

export const dynamic = "force-static";

/**
 * 웹 앱 매니페스트 → /manifest.webmanifest
 *
 * 이게 있어야 휴대폰에서 "홈 화면에 추가" 했을 때 앱처럼 주소창 없이 열리고
 * 아이콘·이름이 제대로 붙는다. 비슷한 사이트 중엔 앱을 따로 내는 곳도 있는데,
 * 우리는 앱 없이 이걸로 대신한다.
 *
 * 사이트가 /festival-calendar 아래에 있어서 주소마다 그 앞머리를 붙인다 (asset).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "ko",
    start_url: asset("/"),
    scope: asset("/"),
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#f25a2a",
    icons: [
      { src: asset("/app-icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: asset("/app-icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      // 배경이 끝까지 차 있고 글자가 가운데 안전 구역 안이라 잘라내기용으로도 그대로 쓴다
      { src: asset("/app-icon-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
