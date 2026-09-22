import type { Metadata } from "next";
import { getAllFestivals } from "@/lib/festivals";
import { getAllConcerts } from "@/lib/concerts";
import { toConcertCard, toFestivalCard } from "@/lib/card";
import { todayKST } from "@/lib/date";
import SavedList from "@/components/SavedList";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "찜한 축제·공연",
  description: "하트를 누른 축제와 공연을 모아봅니다.",
  robots: { index: false }, // 사람마다 내용이 달라 색인 대상이 아니다
};

/**
 * 찜 목록.
 * 찜 자체는 브라우저에만 있어서, 전체 목록을 내려주고 화면에서 골라낸다.
 *
 * 그래서 카드에 쓰는 필드만 추려 보낸다. Festival/Concert 를 그대로 넘겼더니
 * 이 페이지의 RSC 페이로드가 4.3MB 였다. 헤더의 하트가 모든 화면에 있어서
 * Next 가 어디서든 이 페이지를 미리 받아두는 탓에 그 무게가 따라다녔다.
 */
export default function SavedPage() {
  return (
    <div>
      <div className="mb-5 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">찜 목록</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">하트를 누른 축제와 공연이 모여요.</p>
      </div>
      <SavedList
        festivals={getAllFestivals().map(toFestivalCard)}
        concerts={getAllConcerts().map(toConcertCard)}
        today={todayKST()}
      />
    </div>
  );
}
