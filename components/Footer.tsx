import Link from "next/link";
import { REGIONS } from "@/lib/regions";
import { getDataMeta } from "@/lib/festivals";
import { getConcertMeta } from "@/lib/concerts";
import { formatKoreanDate } from "@/lib/date";

/**
 * 푸터: 지역 바로가기 + 데이터 기준일.
 *
 * 기준일을 적는 이유는 신뢰다. 축제 일정은 바뀌는데 화면만 봐서는
 * 이게 오늘 받은 것인지 두 달 전 것인지 알 방법이 없었다.
 */
export default function Footer() {
  // 두 데이터원 중 더 오래된 쪽을 적는다. 둘 다 이 시점 이후로는 최신이라는 뜻
  const fetched = [getDataMeta().fetchedAt, getConcertMeta().fetchedAt]
    .filter(Boolean)
    .sort()[0];
  const asOf = fetched ? fetched.slice(0, 10) : "";

  return (
    <footer className="border-t border-zinc-200 bg-white text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <nav aria-label="지역별 보기" className="flex flex-wrap gap-x-3 gap-y-2">
          {REGIONS.map((r) => (
            <Link key={r.slug} href={`/region/${r.slug}`} className="hover:text-brand-600 dark:hover:text-brand-300">
              {r.name}
            </Link>
          ))}
        </nav>
        {asOf && (
          <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
            {asOf.slice(0, 4)}년 {formatKoreanDate(asOf).replace(/\s*\(.\)$/, "")} 기준 · 매일 새벽에 새로 받아옵니다
          </p>
        )}
      </div>
    </footer>
  );
}
