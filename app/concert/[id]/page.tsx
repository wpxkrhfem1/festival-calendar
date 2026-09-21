import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllConcerts, getConcertById, getRelatedConcerts } from "@/lib/concerts";
import { dDayLabel, formatPeriod, statusOf, todayKST } from "@/lib/date";
import { REGIONS } from "@/lib/regions";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import ConcertPoster from "@/components/ConcertPoster";
import ConcertCard from "@/components/ConcertCard";

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllConcerts().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/concert/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = getConcertById(id);
  if (!c) return {};
  const description = `${formatPeriod(c.startDate, c.endDate)} · ${c.venue}${c.cast ? ` · 출연 ${c.cast.slice(0, 60)}` : ""}`;
  return {
    title: c.title,
    description,
    alternates: { canonical: `/concert/${c.id}` },
    openGraph: {
      title: c.title,
      description,
      siteName: SITE_NAME,
      type: "article",
      ...(c.poster ? { images: [{ url: c.poster }] } : {}),
    },
  };
}

/** 공연 상세 페이지 */
export default async function ConcertPage({ params }: PageProps<"/concert/[id]">) {
  const { id } = await params;
  const c = getConcertById(id);
  if (!c) notFound();

  const today = todayKST();
  const status = statusOf(c.startDate, c.endDate, today);
  const badge = c.openRun && status === "ongoing" ? "상시 공연" : dDayLabel(c.startDate, c.endDate, today);
  const region = REGIONS.find((r) => r.name === c.sido);
  const related = getRelatedConcerts(c, 4);
  const monthNum = Number(c.startDate.slice(5, 7));
  const mapQuery = encodeURIComponent(c.venue);

  // JSON-LD Event 스키마
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": c.genre === "대중음악" ? "MusicEvent" : "TheaterEvent",
    name: c.title,
    startDate: c.startDate,
    endDate: c.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_URL}/concert/${c.id}`,
    ...(c.poster ? { image: [c.poster] } : {}),
    location: {
      "@type": "Place",
      name: c.venue,
      address: { "@type": "PostalAddress", addressCountry: "KR", addressRegion: c.sido },
    },
    ...(c.cast ? { performer: c.cast.split(/,\s*/).slice(0, 10).map((n) => ({ "@type": "Person", name: n })) } : {}),
    ...(c.producer ? { organizer: { "@type": "Organization", name: c.producer } } : {}),
    ...(c.tickets?.length
      ? { offers: c.tickets.map((t) => ({ "@type": "Offer", url: t.url, name: t.name, ...(c.price ? { description: c.price } : {}) })) }
      : {}),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 포스터 (세로형이라 자르지 않고 전체를 보여준다) */}
      <div className="relative -mx-4 aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800 sm:mx-0 sm:aspect-[16/10] sm:rounded-3xl">
        <ConcertPoster src={c.poster} alt={c.title} genre={c.genre} priority contain sizes="(max-width: 1024px) 100vw, 1024px" />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-bold shadow ${
            status === "ongoing" ? "bg-violet-600 text-white" : status === "ended" ? "bg-zinc-700 text-white" : "bg-white text-zinc-900"
          }`}
        >
          {badge}
        </span>
      </div>

      <div className="mt-5">
        <nav aria-label="경로" className="mb-2 flex flex-wrap gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href={`/concert/month/${monthNum}`} className="hover:underline">
            {monthNum}월 공연
          </Link>
          {region && (
            <>
              <span aria-hidden>·</span>
              <span>{region.name}</span>
            </>
          )}
        </nav>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{c.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.genre && (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
              {c.genre}
            </span>
          )}
          {c.openRun && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              오픈런
            </span>
          )}
        </div>
      </div>

      {/* 예매 링크 */}
      {c.tickets && c.tickets.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {c.tickets.map((t) => (
            <a
              key={t.url}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
            >
              {t.name} 예매
            </a>
          ))}
        </div>
      )}

      {/* 핵심 정보 */}
      <dl className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 sm:p-5">
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">기간</dt>
          <dd className="mt-0.5 text-base font-semibold">{formatPeriod(c.startDate, c.endDate)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">공연장</dt>
          <dd className="mt-0.5">
            <p className="font-medium">{c.venue}</p>
            <div className="mt-2 flex gap-2">
              <a href={`https://map.kakao.com/link/search/${mapQuery}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#FEE500] px-3 py-1.5 text-xs font-bold text-[#191919]">
                카카오맵
              </a>
              <a href={`https://map.naver.com/v5/search/${mapQuery}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#03C75A] px-3 py-1.5 text-xs font-bold text-white">
                네이버지도
              </a>
            </div>
          </dd>
        </div>
        {c.cast && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">출연</dt>
            <dd className="mt-0.5">{c.cast}</dd>
          </div>
        )}
        {c.timeGuide && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">공연 시간</dt>
            <dd className="mt-0.5 whitespace-pre-line">{c.timeGuide}</dd>
          </div>
        )}
        {c.price && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">가격</dt>
            <dd className="mt-0.5 whitespace-pre-line">{c.price}</dd>
          </div>
        )}
        {c.runtime && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">러닝타임</dt>
            <dd className="mt-0.5">{c.runtime}</dd>
          </div>
        )}
        {c.ageLimit && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">관람 연령</dt>
            <dd className="mt-0.5">{c.ageLimit}</dd>
          </div>
        )}
        {c.producer && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">기획·제작</dt>
            <dd className="mt-0.5">{c.producer}</dd>
          </div>
        )}
        {c.crew && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">제작진</dt>
            <dd className="mt-0.5">{c.crew}</dd>
          </div>
        )}
      </dl>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">같은 시기 다른 공연</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <ConcertCard concert={r} today={today} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
        정보 출처: 예술경영지원센터 공연예술통합전산망(KOPIS). 일정·가격은 변경될 수 있으니 예매처에서 확인해 주세요.
      </p>
    </article>
  );
}
