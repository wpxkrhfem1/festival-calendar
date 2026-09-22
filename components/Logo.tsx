/**
 * 워드마크. 심볼 없이 글자만으로 만든다.
 *
 * 구성: "전국" 은 한 단계 가볍고 흐리게, "축제자랑" 은 가장 굵게.
 * 가운데 "축제" 두 글자에만 브랜드 그라데이션을 입혀 색 리듬을 준다.
 * 자간을 좁혀 여섯 글자가 한 덩어리로 읽히게 했다.
 *
 * 이미지가 아니라 진짜 글자라서 어떤 크기에서도 선명하고,
 * 검색엔진이 읽고, 다크모드에서 색이 알아서 바뀐다.
 */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`select-none font-extrabold tracking-[-0.045em] ${compact ? "text-[17px]" : "text-[19px] sm:text-[22px]"}`}
    >
      <span className="font-semibold text-zinc-400 dark:text-zinc-500">전국</span>
      <span className="bg-gradient-to-br from-brand-500 to-amber-400 bg-clip-text text-transparent">축제</span>
      <span className="text-zinc-900 dark:text-zinc-50">자랑</span>
    </span>
  );
}
