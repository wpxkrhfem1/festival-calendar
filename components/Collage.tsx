import type { ReactNode } from "react";

interface Props {
  /** 칸에 들어갈 이미지들 (최대 4개). 장수에 따라 배치가 달라진다 */
  cells: ReactNode[];
  /** 한 장도 없을 때 보여줄 내용 */
  empty?: ReactNode;
}

/**
 * 월 카드용 이미지 콜라주.
 *
 * 장수에 맞춰 배치를 바꿔 빈 칸이 남지 않게 한다.
 *  1장 → 전체를 채운다
 *  2장 → 좌우로 반씩
 *  3장 → 왼쪽 큰 칸 하나 + 오른쪽 위아래
 *  4장 → 2x2
 *
 * 2x2 로 고정하면 공연이 한두 개뿐인 달에서 절반이 회색으로 비어 보인다.
 */
export default function Collage({ cells, empty }: Props) {
  const items = cells.slice(0, 4);
  const n = items.length;

  if (n === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-3xl dark:from-zinc-800 dark:to-zinc-700">
        {empty ?? <span aria-hidden>🗓️</span>}
      </div>
    );
  }

  const layout =
    n === 1 ? "grid-cols-1 grid-rows-1" : n === 2 ? "grid-cols-2 grid-rows-1" : "grid-cols-2 grid-rows-2";

  return (
    <div className={`grid h-full w-full gap-0.5 ${layout}`}>
      {items.map((cell, i) => (
        <div key={i} className={`relative overflow-hidden ${n === 3 && i === 0 ? "row-span-2" : ""}`}>
          {cell}
        </div>
      ))}
    </div>
  );
}
