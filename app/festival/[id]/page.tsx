import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllFestivals, getAlternativeFestivals, getFestivalById, getRelatedFestivals } from "@/lib/festivals";
import { getConcertsNear } from "@/lib/concerts";
import { dDayLabel, formatPeriod, statusOf, todayKST } from "@/lib/date";
import { regionByName } from "@/lib/regions";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import FestivalImage from "@/components/FestivalImage";
import FestivalCard from "@/components/FestivalCard";
import PhotoGallery from "@/components/PhotoGallery";
import ConcertCard from "@/components/ConcertCard";
import TagChip from "@/components/TagChip";
import SaveButton from "@/components/SaveButton";
import ShareButton from "@/components/ShareButton";
import CalendarButton from "@/components/CalendarButton";

export const revalidate = 86400;

export function generateStaticParams() {
  return getAllFestivals().map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }: PageProps<"/festival/[id]">): Promise<Metadata> {
  const { id } = await params;
  const f = getFestivalById(id);
  if (!f) return {};
  const region = [f.sido, f.sigungu].filter(Boolean).join(" ");
  const description = `${formatPeriod(f.startDate, f.endDate)} · ${region}. ${f.overview.slice(0, 120).replace(/\n/g, " ")}`.trim();
  // 이미 끝난 축제는 색인하지 않는다. 검색으로 들어와도 갈 수 없는 페이지다
  const ended = statusOf(f.startDate, f.endDate, todayKST()) === "ended";
  return {
    title: ended ? `${f.title} (종료)` : f.title,
    description,
    ...(ended ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: `/festival/${f.id}` },
    openGraph: {
      title: f.title,
      description,
      siteName: SITE_NAME,
      type: "article",
      ...(f.image ? { images: [{ url: f.image }] } : {}),
    },
  };
}

/** 지도 링크 (카카오맵 / 네이버지도) */
function mapLinks(f: { title: string; address: string; lat?: number; lng?: number }) {
  const q = encodeURIComponent(f.address || f.title);
  const kakao = f.lat && f.lng ? `https://map.kakao.com/link/map/${encodeURIComponent(f.title)},${f.lat},${f.lng}` : `https://map.kakao.com/link/search/${q}`;
  const naver = `https://map.naver.com/v5/search/${q}`;
  return { kakao, naver };
}

/** 축제 상세 페이지 */
export default async function FestivalPage({ params }: PageProps<"/festival/[id]">) {
  const { id } = await params;
  const f = getFestivalById(id);
  if (!f) notFound();

  const today = todayKST();
  const status = statusOf(f.startDate, f.endDate, today);
  const dday = dDayLabel(f.startDate, f.endDate, today);
  const region = regionByName(f.sido);
  const ended = status === "ended";
  // 끝난 축제 옆에 또 끝난 축제를 늘어놓지 않는다
  const related = ended ? getAlternativeFestivals(f, 4, today) : getRelatedFestivals(f, 4);
  // 끝난 축제에는 붙이지 않는다. 축제 기간과 겹치는 공연이 이미 다 지났다
  const nearbyConcerts = ended ? [] : getConcertsNear({ sido: f.sido, startDate: f.startDate, endDate: f.endDate }, 4, today);
  const { kakao, naver } = mapLinks(f);
  const monthNum = Number(f.startDate.slice(5, 7));

  // JSON-LD Event 스키마 (검색엔진 리치 결과용)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: f.title,
    startDate: f.startDate,
    endDate: f.endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: f.overview.slice(0, 500),
    url: `${SITE_URL}/festival/${f.id}`,
    ...(f.image ? { image: [f.image] } : {}),
    location: {
      "@type": "Place",
      name: f.place || f.address || f.title,
      address: { "@type": "PostalAddress", streetAddress: f.address, addressCountry: "KR", addressRegion: f.sido, addressLocality: f.sigungu },
      ...(f.lat && f.lng ? { geo: { "@type": "GeoCoordinates", latitude: f.lat, longitude: f.lng } } : {}),
    },
    ...(f.sponsor ? { organizer: { "@type": "Organization", name: f.sponsor } } : {}),
    ...(f.fee ? { offers: { "@type": "Offer", description: f.fee, url: f.homepage || undefined } } : {}),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* 대표 이미지 */}
      <div className="relative -mx-4 aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800 sm:mx-0 sm:aspect-[16/9] sm:rounded-3xl">
        <FestivalImage src={f.image || f.thumbnail} alt={f.title} tags={f.tags} priority fit="contain" sizes="(max-width: 1024px) 100vw, 1024px" />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-bold shadow ${
            status === "ongoing" ? "bg-brand-500 text-white" : status === "ended" ? "bg-zinc-700 text-white" : "bg-white text-zinc-900"
          }`}
        >
          {dday}
        </span>
      </div>

      {ended && (
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/30">
          <p className="text-[15px] font-bold text-amber-900 dark:text-amber-100">이 축제는 이미 끝났어요</p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/90">
            다음 회차 일정이 공개되면 이 페이지에 그대로 올라와요. 아래에서 지금 갈 수 있는 축제를 골라보세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/browse?when=ongoing" className="rounded-full bg-amber-900 px-3.5 py-1.5 text-xs font-bold text-white dark:bg-amber-200 dark:text-amber-950">
              지금 열리는 축제
            </Link>
            {region && (
              <Link href={`/region/${region.slug}`} className="rounded-full border border-amber-400 px-3.5 py-1.5 text-xs font-bold text-amber-900 dark:border-amber-700 dark:text-amber-100">
                {region.name} 축제 보기
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <nav aria-label="경로" className="mb-2 flex flex-wrap gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Link href={`/month/${monthNum}`} className="hover:underline">
            {monthNum}월 축제
          </Link>
          {region && (
            <>
              <span aria-hidden>·</span>
              <Link href={`/region/${region.slug}`} className="hover:underline">
                {region.name} 축제
              </Link>
            </>
          )}
        </nav>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{f.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {f.tags.map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
      </div>

      {/* 찜 · 공유 */}
      <div className="mt-5 flex flex-wrap gap-2">
        <SaveButton kind="festival" id={f.id} title={f.title} variant="detail" />
        <ShareButton title={f.title} text={`${formatPeriod(f.startDate, f.endDate)} · ${[f.sido, f.sigungu].filter(Boolean).join(" ")}`} />
        {/* 끝난 축제는 담을 이유가 없다 */}
        {!ended && <CalendarButton kind="festival" id={f.id} title={f.title} />}
      </div>

      {/* 핵심 정보 */}
      <dl className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 sm:p-5">
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">기간</dt>
          <dd className="mt-0.5 text-base font-semibold">{formatPeriod(f.startDate, f.endDate)}</dd>
        </div>
        {(f.address || f.place) && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">장소</dt>
            <dd className="mt-0.5">
              {f.place && <p className="font-medium">{f.place}</p>}
              {f.address && <p className="text-zinc-700 dark:text-zinc-300">{f.address}</p>}
              <div className="mt-2 flex gap-2">
                <a href={kakao} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#FEE500] px-3 py-1.5 text-xs font-bold text-[#191919]">
                  카카오맵
                </a>
                <a href={naver} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#03C75A] px-3 py-1.5 text-xs font-bold text-white">
                  네이버지도
                </a>
              </div>
            </dd>
          </div>
        )}
        {f.playtime && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">시간</dt>
            <dd className="mt-0.5 whitespace-pre-line">{f.playtime}</dd>
          </div>
        )}
        {f.fee && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">이용 요금</dt>
            <dd className="mt-0.5 whitespace-pre-line">{f.fee}</dd>
          </div>
        )}
        {f.tel && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">문의</dt>
            <dd className="mt-0.5">
              <a href={`tel:${f.tel.replace(/[^\d+]/g, "")}`} className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
                {f.tel}
              </a>
            </dd>
          </div>
        )}
        {f.homepage && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">홈페이지</dt>
            <dd className="mt-0.5 truncate">
              <a href={f.homepage} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300">
                {f.homepage.replace(/^https?:\/\//, "")}
              </a>
            </dd>
          </div>
        )}
        {f.sponsor && (
          <div>
            <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">주최/주관</dt>
            <dd className="mt-0.5">{f.sponsor}</dd>
          </div>
        )}
      </dl>

      {/* 개요 전문 */}
      {f.overview && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-bold">축제 소개</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{f.overview}</p>
        </section>
      )}

      {f.photos && f.photos.length > 0 && <PhotoGallery photos={f.photos} title={f.title} />}

      {f.program && (
        <section className="mt-8">
          <h2 className="mb-2 text-lg font-bold">프로그램</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{f.program}</p>
        </section>
      )}

      {/* 같은 지역·같은 기간 공연. 축제 하나 보러 가는 김에 하나 더 보라는 뜻이다 */}
      {nearbyConcerts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-lg font-bold">이 축제 가는 날, {f.sido}에서 하는 공연</h2>
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">축제 기간과 날짜가 겹치는 공연이에요</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {nearbyConcerts.map((c) => (
              <li key={c.id}>
                <ConcertCard concert={c} today={today} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 추천 */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">{ended ? "지금 갈 수 있는 축제" : "같은 시기 다른 축제"}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.id}>
                <FestivalCard festival={r} today={today} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
        정보 출처: 한국관광공사 TourAPI. 일정·요금은 변경될 수 있으니 방문 전 공식 홈페이지나 문의처에서 확인해 주세요.
      </p>
    </article>
  );
}
