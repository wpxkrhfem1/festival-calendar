"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { ConcertCardData, FestivalCardData } from "@/lib/card";
import { getSavedServerSnapshot, getSavedSnapshot, subscribeSaved } from "@/lib/saved";
import FestivalCard from "./FestivalCard";
import ConcertCard from "./ConcertCard";
import EmptyState from "./EmptyState";
import CalendarButton from "./CalendarButton";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { EventInput } from "@/lib/ics";

interface Props {
  /** 전체 목록. 찜한 id 만 골라 쓴다 */
  festivals: FestivalCardData[];
  concerts: ConcertCardData[];
  today: string;
}

/**
 * 찜 목록 화면.
 * 찜은 브라우저에만 있어서 서버가 미리 그릴 수 없다.
 * 전체 목록을 받아두고 클라이언트에서 id 로 골라낸다.
 */
export default function SavedList({ festivals, concerts, today }: Props) {
  const saved = useSyncExternalStore(subscribeSaved, getSavedSnapshot, getSavedServerSnapshot);

  const fMap = new Map(festivals.map((f) => [f.id, f]));
  const cMap = new Map(concerts.map((c) => [c.id, c]));
  // 찜한 순서(최근 것이 앞)를 그대로 유지한다
  const myFestivals = saved.festival.map((id) => fMap.get(id)).filter((x): x is FestivalCardData => !!x);
  const myConcerts = saved.concert.map((id) => cMap.get(id)).filter((x): x is ConcertCardData => !!x);
  const total = myFestivals.length + myConcerts.length;

  if (total === 0) {
    return (
      <EmptyState
        title="아직 찜한 게 없어요"
        description="카드 오른쪽 위 하트를 누르면 여기에 모여요. 로그인 없이 이 브라우저에만 저장됩니다."
        showHome
      />
    );
  }

  // 아직 안 끝난 것만 캘린더로 보낸다. 지난 일정을 담아봐야 알림이 오지 않는다
  const upcomingFestivals = myFestivals.filter((f) => f.endDate >= today);
  const upcomingConcerts = myConcerts.filter((c) => c.endDate >= today);
  const icsCount = upcomingFestivals.length + upcomingConcerts.length;
  // 이 화면은 카드용 최소 데이터만 들고 있다. 캘린더에 필요한 건 그걸로 충분하다
  const icsEvents: EventInput[] = [
    ...upcomingFestivals.map((f) => ({
      uid: `festival-${f.id}@jeonguk-chukje`,
      title: f.title,
      startDate: f.startDate,
      endDate: f.endDate,
      location: [f.sido, f.sigungu].filter(Boolean).join(" "),
      description: "",
      url: `${SITE_URL}/festival/${f.id}`,
    })),
    ...upcomingConcerts.map((c) => ({
      uid: `concert-${c.id}@jeonguk-chukje`,
      title: c.title,
      startDate: c.startDate,
      endDate: c.endDate,
      location: c.venue || c.sido,
      description: c.genre ?? "",
      url: `${SITE_URL}/concert/${c.id}`,
    })),
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        축제 {myFestivals.length}개 · 공연 {myConcerts.length}개
      </p>

      {icsCount > 0 && (
        <CalendarButton
          events={icsEvents}
          fileBase={`${SITE_NAME} 일정`}
          label={`찜한 ${icsCount}개를 캘린더에 담기`}
          wide
        />
      )}

      {myFestivals.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-bold">찜한 축제</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {myFestivals.map((f) => (
              <li key={f.id}>
                <FestivalCard festival={f} today={today} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {myConcerts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">찜한 공연</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {myConcerts.map((c) => (
              <li key={c.id}>
                <ConcertCard concert={c} today={today} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
        찜은 이 브라우저에만 저장돼요. 다른 기기에서는 보이지 않고, 브라우저 데이터를 지우면 사라집니다.{" "}
        <Link href="/" className="underline underline-offset-2">
          더 둘러보기
        </Link>
      </p>
    </div>
  );
}
