import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** robots.txt 자동 생성 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/search", "/browse", "/concert/browse", "/saved"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
