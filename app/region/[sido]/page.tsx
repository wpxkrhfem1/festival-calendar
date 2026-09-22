import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFestivalsByRegionSlug } from "@/lib/festivals";
import { getConcertsByRegionSlug } from "@/lib/concerts";
import type { Concert, Festival } from "@/lib/types";
import { REGIONS, regionBySlug } from "@/lib/regions";
import { todayKST } from "@/lib/date";
import { SITE_NAME } from "@/lib/site";
import RegionSections from "@/components/RegionSections";

/**
 * 이미 끝난 것은 지역 페이지에 올리지 않는다.
 * 여기 오는 사람은 "이 동네에 뭐 있나" 를 보러 오는 것이지
 * 지난봄에 뭐가 있었는지 보러 오는 게 아니다.
 * 지난 일정은 상세 페이지 링크로만 남는다.
 */
function live<T extends Festival | Concert>(list: T[], today: string): T[] {
  return list.filter((x) => x.endDate >= today);
}

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return REGIONS.map((r) => ({ sido: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/region/[sido]">): Promise<Metadata> {
  const { sido } = await params;
  const region = regionBySlug(sido);
  if (!region) return {};
  const today = todayKST();
  const festivals = live(getFestivalsByRegionSlug(sido), today);
  const concerts = live(getConcertsByRegionSlug(sido), today);
  const year = today.slice(0, 4);
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
  const festivals = live(getFestivalsByRegionSlug(sido), today);
  const concerts = live(getConcertsByRegionSlug(sido), today);

  return (
    <div>
      <div className="mb-4 pt-2">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-300">지역별 보기</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{region.name} 축제·공연</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {region.aliases[0]}에서 지금 갈 수 있는 축제 {festivals.length}개 · 공연 {concerts.length}개
        </p>
      </div>
      <RegionSections festivals={festivals} concerts={concerts} today={today} regionName={region.name} />
    </div>
  );
}
