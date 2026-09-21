import type { MetadataRoute } from "next";
import { getAllFestivals } from "@/lib/festivals";
import { REGIONS } from "@/lib/regions";
import { SITE_URL } from "@/lib/site";

/** sitemap.xml 자동 생성: 홈 · 12개월 · 지역 · 축제 상세 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const months: MetadataRoute.Sitemap = Array.from({ length: 12 }, (_, i) => ({
    url: `${SITE_URL}/month/${i + 1}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));
  const regions: MetadataRoute.Sitemap = REGIONS.map((r) => ({
    url: `${SITE_URL}/region/${r.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const festivals: MetadataRoute.Sitemap = getAllFestivals().map((f) => ({
    url: `${SITE_URL}/festival/${f.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  return [{ url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 }, ...months, ...regions, ...festivals];
}
