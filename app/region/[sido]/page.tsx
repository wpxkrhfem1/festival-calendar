import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFestivalsByRegionSlug } from "@/lib/festivals";
import { getConcertsByRegionSlug } from "@/lib/concerts";
import { REGIONS, regionBySlug } from "@/lib/regions";
import { todayKST } from "@/lib/date";
import { SITE_NAME } from "@/lib/site";
import RegionSections from "@/components/RegionSections";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return REGIONS.map((r) => ({ sido: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/region/[sido]">): Promise<Metadata> {
  const { sido } = await params;
  const region = regionBySlug(sido);
  if (!region) return {};
  const festivals = getFestivalsByRegionSlug(sido);
  const concerts = getConcertsByRegionSlug(sido);
  const year = todayKST().slice(0, 4);
  const title = `${region.name} 축제·공연 총정리 ${year}`;
  const description = `${region.name} 지역 축제 ${festivals.length}개와 공연 ${concerts.length}개를 한곳에 모았어요. ${festivals.slice(0, 3).map((f) => f.title).join(", ")}`;
  return {
    title,
    description,
    alternates: { canonical: `/region/${sido}` },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, siteName: SITE_NAME, type: "website" },
  };
}

/** 지역별 보기 (월별 탭 포함) */
export default async function RegionPage({ params }: PageProps<"/region/[sido]">) {
  const { sido } = await params;
  const region = regionBySlug(sido);
  if (!region) notFound();

  const today = todayKST();
  const festivals = getFestivalsByRegionSlug(sido);
  const concerts = getConcertsByRegionSlug(sido);

  return (
    <div>
      <div className="mb-4 pt-2">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-300">지역별 보기</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{region.name} 축제·공연</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {region.aliases[0]}에서 열리는 축제 {festivals.length}개 · 공연 {concerts.length}개
        </p>
      </div>
      <RegionSections festivals={festivals} concerts={concerts} today={today} regionName={region.name} />
    </div>
  );
}
