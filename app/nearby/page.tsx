import type { Metadata } from "next";
import { getLiveFestivals } from "@/lib/festivals";
import { toFestivalCard } from "@/lib/card";
import { todayKST } from "@/lib/date";
import NearbyList from "@/components/NearbyList";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "내 주변 축제",
  description: "지금 있는 곳에서 가까운 축제를 거리순으로 보여드려요.",
  alternates: { canonical: "/nearby" },
};

/**
 * 내 주변 축제. 좌표가 있는 축제만 대상이다.
 *
 * 거리 계산은 브라우저에서 하므로 목록을 통째로 넘겨야 한다. 그래서
 * 카드에 쓰는 필드만 추려 보낸다 — Festival 을 그대로 넘기면 overview·photos·
 * program 까지 따라와 이 페이지 하나가 1.9MB 였다.
 * 화면에서 어차피 "다가오는 것만" 이 기본이라 끝난 축제도 서버에서 뺀다.
 */
export default function NearbyPage() {
  const today = todayKST();
  const withCoords = getLiveFestivals(today)
    .filter((f) => typeof f.lat === "number" && typeof f.lng === "number")
    .map(toFestivalCard);

  return (
    <div>
      <div className="mb-5 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">내 주변 축제</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          지금 있는 곳에서 가까운 순으로 보여드려요. 위치는 브라우저 안에서만 쓰고 저장하지 않아요.
        </p>
      </div>
      <NearbyList festivals={withCoords} today={today} />
    </div>
  );
}
