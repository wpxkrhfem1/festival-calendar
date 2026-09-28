import type { Metadata } from "next";
import { getAllFestivals } from "@/lib/festivals";
import { toFestivalCard } from "@/lib/card";
import { todayKST } from "@/lib/date";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { pickShareImage } from "@/lib/asset";
import CalendarView from "@/components/CalendarView";

export const revalidate = 86400;

/** 이번 달 1일 이후에 끝나는 것만. 지난달에 끝난 축제는 달력에 나올 일이 없다 */
function calendarFestivals(today: string) {
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  return getAllFestivals().filter((f) => f.endDate >= firstOfMonth);
}

export async function generateMetadata(): Promise<Metadata> {
  const today = todayKST();
  const list = calendarFestivals(today);
  const title = "축제 달력";
  const description = "날짜를 누르면 그날 전국에서 열리는 축제를 보여드려요. 칸마다 그날 열리는 축제 수가 적혀 있어요.";
  return {
    title,
    description,
    alternates: { canonical: "/calendar/" },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: pickShareImage(list.filter((f) => f.endDate >= today), SITE_URL) }],
    },
  };
}

/**
 * 날짜 칸 달력 페이지.
 * 칸 계산과 날짜 선택은 브라우저에서 한다. 카드에 쓰는 필드만 넘겨 가볍게 둔다.
 */
export default function CalendarPage() {
  const today = todayKST();
  const festivals = calendarFestivals(today).map(toFestivalCard);

  return (
    <div>
      <div className="mb-5 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">축제 달력</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          날짜를 누르면 그날 전국에서 열리는 축제가 아래에 나와요.
        </p>
      </div>
      <CalendarView festivals={festivals} today={today} />
    </div>
  );
}
