import Link from "next/link";

interface Props {
  title: string;
  description?: string;
  /** 홈으로 돌아가기 링크 표시 */
  showHome?: boolean;
}

/** 빈 상태 안내 (검색 결과 없음, 해당 월 축제 없음 등) */
export default function EmptyState({ title, description, showHome }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
      <span aria-hidden className="mb-3 text-4xl">🎈</span>
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      {showHome && (
        <Link href="/" className="mt-5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          월별 달력 보기
        </Link>
      )}
    </div>
  );
}
