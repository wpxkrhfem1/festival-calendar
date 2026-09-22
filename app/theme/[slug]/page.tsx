import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveFestivals } from "@/lib/festivals";
import { formatKoreanDate, statusOf, todayKST } from "@/lib/date";
import { REGIONS } from "@/lib/regions";
import { THEMES, themeBySlug } from "@/lib/tags";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import FestivalCard from "@/components/FestivalCard";
import EmptyState from "@/components/EmptyState";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return THEMES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/theme/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const theme = themeBySlug(slug);
  if (!theme) return {};
  const today = todayKST();
  const list = getLiveFestivals(today).filter((f) => f.tags.includes(theme.tag));
  const year = today.slice(0, 4);
  const title = `${theme.name} 총정리 ${year}`;
  const description = `지금 갈 수 있는 전국 ${theme.name} ${list.length}개. ${list
    .slice(0, 3)
    .map((f) => f.title)
    .join(", ")} 등 일정과 장소를 한눈에 확인하세요.`;
  return {
    title,
    description,
    alternates: { canonical: `/theme/${slug}` },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, siteName: SITE_NAME, type: "website" },
  };
}

/**
 * 테마별 랜딩 페이지.
 *
 * /browse 는 조건 조합이 많아 noindex 라서 검색으로 들어올 입구가 없었다.
 * 카테고리마다 고정 주소를 하나씩 두고 사이트맵에 넣는다.
 * 끝난 축제는 담지 않는다 — 검색으로 들어와도 갈 수 없는 축제라 의미가 없다.
 */
export default async function ThemePage({ params }: PageProps<"/theme/[slug]">) {
  const { slug } = await params;
  const theme = themeBySlug(slug);
  if (!theme) notFound();

  const today = todayKST();
  const list = getLiveFestivals(today)
    .filter((f) => f.tags.includes(theme.tag))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const ongoing = list.filter((f) => statusOf(f.startDate, f.endDate, today) === "ongoing");
  const upcoming = list.filter((f) => statusOf(f.startDate, f.endDate, today) === "upcoming");

  // 이 테마의 축제가 실제로 있는 지역만 아래에 늘어놓는다
  const regionCounts = REGIONS.map((r) => ({
    region: r,
    count: list.filter((f) => f.sido === r.name).length,
  })).filter((x) => x.count > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${theme.name} 총정리`,
    numberOfItems: list.length,
    itemListElement: list.slice(0, 20).map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/festival/${f.id}`,
      name: f.title,
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mb-5 pt-2">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-300">테마별 보기</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{theme.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          지금 갈 수 있는 축제 {list.length}개 · {formatKoreanDate(today)} 기준
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{theme.intro}</p>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={`지금은 ${theme.name}가 없어요`}
          description="일정이 올라오면 바로 여기에 보여드릴게요."
          showHome
        />
      ) : (
        <>
          {ongoing.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                지금 열리고 있어요
                <span className="text-sm font-normal text-zinc-500">{ongoing.length}개</span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {ongoing.map((f, i) => (
                  <li key={f.id}>
                    <FestivalCard festival={f} today={today} priority={i < 3} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">
                앞으로 열려요 <span className="text-sm font-normal text-zinc-500">{upcoming.length}개</span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {upcoming.slice(0, 60).map((f) => (
                  <li key={f.id}>
                    <FestivalCard festival={f} today={today} />
                  </li>
                ))}
              </ul>
              {upcoming.length > 60 && (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  앞의 60개만 보여드려요.{" "}
                  <Link
                    href={`/browse?category=${encodeURIComponent(theme.tag)}&when=upcoming`}
                    className="text-brand-600 underline-offset-2 hover:underline dark:text-brand-300"
                  >
                    조건을 좁혀서 찾기
                  </Link>
                </p>
              )}
            </section>
          )}
        </>
      )}

      {regionCounts.length > 0 && (
        <nav aria-label="지역별 보기" className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="mb-3 text-base font-bold">지역으로 좁혀보기</h2>
          <ul className="flex flex-wrap gap-2">
            {regionCounts.map(({ region, count }) => (
              <li key={region.slug}>
                <Link
                  href={`/browse?category=${encodeURIComponent(theme.tag)}&region=${region.slug}&when=upcoming`}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-brand-300"
                >
                  {region.name}
                  <span className="text-xs text-zinc-400">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <nav aria-label="다른 테마" className="mt-8">
        <h2 className="mb-3 text-base font-bold">다른 테마도 보기</h2>
        <ul className="flex flex-wrap gap-2">
          {THEMES.filter((t) => t.slug !== theme.slug).map((t) => (
            <li key={t.slug}>
              <Link
                href={`/theme/${t.slug}`}
                className="rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium transition hover:border-brand-400 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-brand-300"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
