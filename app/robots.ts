import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 정적 내보내기에서는 빌드 때 파일로 구워야 한다 (서버가 없다)
export const dynamic = "force-static";

/** robots.txt 자동 생성 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/search", "/browse", "/concert/browse", "/saved"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
