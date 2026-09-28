import type { Metadata } from "next";
import Link from "next/link";
import { getAllFestivals } from "@/lib/festivals";
import { toFestivalCard } from "@/lib/card";
import { todayKST } from "@/lib/date";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { pickShareImage } from "@/lib/asset";
import MapView from "@/components/MapView";

export const revalidate = 86400;

/** 아직 안 끝났고 좌표가 있는 축제만 */
function mapFestivals(today: string) {
  return getAllFestivals().filter(
    (f) => f.endDate >= today && typeof f.lat === "number" && typeof f.lng === "number",
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const today = todayKST();
  const title = "축제 지도";
  const description = "전국 축제를 한 지도 위에 모았어요. 이번 주말, 이번 달에 열리는 축제가 어디 있는지 한눈에 보세요.";
  return {
    title,
    description,
    alternates: { canonical: "/map/" },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: pickShareImage(mapFestivals(today), SITE_URL) }],
    },
  };
}

/**
 * 축제 지도 페이지.
 * 지도 타일과 점 찍기는 브라우저에서 한다. 카드에 쓰는 필드만 넘긴다.
 */
export default function MapPage() {
  const today = todayKST();
  const festivals = mapFestivals(today).map(toFestivalCard);

  return (
    <div>
      <div className="mb-5 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">축제 지도</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          시기를 고르면 그때 열리는 축제가 지도에 찍혀요. 내 위치에서 가까운 순으로 보려면{" "}
          <Link href="/nearby" prefetch={false} className="font-semibold text-brand-600 underline underline-offset-2 dark:text-brand-300">
            내 주변
          </Link>
          을 눌러 보세요.
        </p>
      </div>
      <MapView festivals={festivals} today={today} />
    </div>
  );
}
