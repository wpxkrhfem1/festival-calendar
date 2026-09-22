import type { MetadataRoute } from "next";
import { getAllFestivals } from "@/lib/festivals";
import { getAllConcerts } from "@/lib/concerts";
import { REGIONS } from "@/lib/regions";
import { SITE_URL } from "@/lib/site";

/** sitemap.xml 자동 생성: 홈 · 12개월 · 지역 · 축제 상세 · 공연 홈/12개월/상세 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const months: MetadataRoute.Sitemap = Array.from({ length: 12 }, (_, i) => ({
    url: `${SITE_URL}/month/${i + 1}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));
  const concertMonths: MetadataRoute.Sitemap = Array.from({ length: 12 }, (_, i) => ({
    url: `${SITE_URL}/concert/month/${i + 1}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
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
  const concerts: MetadataRoute.Sitemap = getAllConcerts().map((c) => ({
    url: `${SITE_URL}/concert/${c.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/concert`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/nearby`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...months,
    ...concertMonths,
    ...regions,
    ...festivals,
    ...concerts,
  ];
}
