import Link from "next/link";
import { getDataMeta } from "@/lib/festivals";
import { REGIONS } from "@/lib/regions";

/** 푸터: 지역 바로가기 + 데이터 출처 표기 */
export default function Footer() {
  const meta = getDataMeta();
  const updated = meta.fetchedAt ? meta.fetchedAt.slice(0, 10) : "";
  return (
    <footer className="border-t border-zinc-200 bg-white text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <nav aria-label="지역별 보기" className="mb-6 flex flex-wrap gap-x-3 gap-y-2">
          {REGIONS.map((r) => (
            <Link key={r.slug} href={`/region/${r.slug}`} className="hover:text-brand-600 dark:hover:text-brand-300">
              {r.name}
            </Link>
          ))}
        </nav>
        <p>
          축제 데이터: <strong className="font-semibold text-zinc-700 dark:text-zinc-200">한국관광공사</strong> (TourAPI 4.0)
          {updated && <span className="ml-2">· 마지막 갱신 {updated}</span>}
        </p>
        <p className="mt-1">
          공연 데이터: <strong className="font-semibold text-zinc-700 dark:text-zinc-200">예술경영지원센터</strong> 공연예술통합전산망(KOPIS)
        </p>
        <p className="mt-2">일정과 가격은 주최 측 사정으로 변경될 수 있어요. 방문 전 공식 홈페이지나 예매처를 확인해 주세요.</p>
      </div>
    </footer>
  );
}
