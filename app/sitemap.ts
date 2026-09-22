import type { MetadataRoute } from "next";
import { getFestivalsByMonth, getLiveFestivals } from "@/lib/festivals";
import { getLiveConcerts } from "@/lib/concerts";
import { REGIONS } from "@/lib/regions";
import { THEMES } from "@/lib/tags";
import { SITE_URL } from "@/lib/site";
import { todayKST } from "@/lib/date";

/**
 * sitemap.xml 자동 생성: 홈 · 12개월 · 지역 · 축제 상세 · 공연 홈/12개월/상세
 *
 * 끝난 축제·공연은 넣지 않는다. 전체 742건 중 506건(68%)이 이미 지난 축제라
 * 그대로 두면 검색엔진이 작년 벚꽃축제를 계속 물어오고, 들어온 사람은 전부 나간다.
 * 상세 페이지 자체는 링크가 깨지지 않게 그대로 두고 색인 대상에서만 뺀다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const today = todayKST();

  // 이미 지난 달은 넣지 않는다. 그 페이지는 noindex 이고 내용도 대부분 끝난 축제다.
  // 다음 해 일정이 쌓이면 기본 연도가 넘어가면서 다시 들어온다.
  const nowYear = Number(today.slice(0, 4));
  const nowMonth = Number(today.slice(5, 7));
  const months: MetadataRoute.Sitemap = Array.from({ length: 12 }, (_, i) => i + 1)
    .filter((m) => {
      const y = getFestivalsByMonth(m, today).defaultYear;
      return !(y < nowYear || (y === nowYear && m < nowMonth));
    })
    .map((m) => ({
      url: `${SITE_URL}/month/${m}`,
      lastModified: now,
      changeFrequency: "daily" as const,
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
  const themes: MetadataRoute.Sitemap = THEMES.map((t) => ({
    url: `${SITE_URL}/theme/${t.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const festivals: MetadataRoute.Sitemap = getLiveFestivals(today).map((f) => ({
    url: `${SITE_URL}/festival/${f.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const concerts: MetadataRoute.Sitemap = getLiveConcerts(today).map((c) => ({
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
    ...themes,
    ...regions,
    ...festivals,
    ...concerts,
  ];
}
