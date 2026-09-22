import Link from "next/link";
import { REGIONS } from "@/lib/regions";

/** 푸터: 지역 바로가기 */
export default function Footer() {
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
      </div>
    </footer>
  );
}
