import type { Metadata } from "next";
import { getAllFestivals } from "@/lib/festivals";
import { todayKST } from "@/lib/date";
import NearbyList from "@/components/NearbyList";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "내 주변 축제",
  description: "지금 있는 곳에서 가까운 축제를 거리순으로 보여드려요.",
  alternates: { canonical: "/nearby" },
};

/** 내 주변 축제. 좌표가 있는 축제만 대상이다 */
export default function NearbyPage() {
  const withCoords = getAllFestivals().filter((f) => typeof f.lat === "number" && typeof f.lng === "number");

  return (
    <div>
      <div className="mb-5 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">내 주변 축제</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          지금 있는 곳에서 가까운 순으로 보여드려요. 위치는 브라우저 안에서만 쓰고 저장하지 않아요.
        </p>
      </div>
      <NearbyList festivals={withCoords} today={todayKST()} />
    </div>
  );
}
