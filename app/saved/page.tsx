import type { Metadata } from "next";
import { getAllFestivals } from "@/lib/festivals";
import { getAllConcerts } from "@/lib/concerts";
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
 * 목록이 커지면 여기서 필요한 필드만 추려 내려보내는 걸 고려한다.
 */
export default function SavedPage() {
  return (
    <div>
      <div className="mb-5 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">찜 목록</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">하트를 누른 축제와 공연이 모여요.</p>
      </div>
      <SavedList festivals={getAllFestivals()} concerts={getAllConcerts()} today={todayKST()} />
    </div>
  );
}
