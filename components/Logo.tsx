/**
 * 워드마크.
 * "전국" 은 얇게, "축제자랑" 은 굵게 두고 가운데 축제 아이콘을 둥근 배지로 감싼다.
 * 글자로만 만들어 어떤 화면 크기에서도 또렷하게 보인다.
 */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-amber-400 text-[15px] shadow-sm"
      >
        🎪
      </span>
      {!compact && (
        <span className="text-base font-extrabold tracking-tight sm:text-lg">
          <span className="font-medium text-zinc-500 dark:text-zinc-400">전국</span>
          <span className="text-zinc-900 dark:text-zinc-50">축제자랑</span>
        </span>
      )}
    </span>
  );
}
