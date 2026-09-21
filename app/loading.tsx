/** 로딩 스켈레톤 (카드 6개) */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="불러오는 중">
      <div className="mb-6 pt-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:flex-col">
            <div className="aspect-square w-32 shrink-0 animate-pulse bg-zinc-200 dark:bg-zinc-800 sm:aspect-[4/3] sm:w-full" />
            <div className="flex-1 space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
