/** 검색 폼 (GET /search?q=) — 자바스크립트 없이도 동작 */
export default function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" method="get" role="search" className="flex gap-2">
      <label htmlFor="q" className="sr-only">
        검색어
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="축제명 또는 지역"
        autoComplete="off"
        maxLength={50}
        className="h-11 flex-1 rounded-full border border-zinc-300 bg-white px-4 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button type="submit" className="h-11 shrink-0 rounded-full bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600">
        검색
      </button>
    </form>
  );
}
