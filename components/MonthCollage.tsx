import type { Festival } from "@/lib/types";
import FestivalImage from "./FestivalImage";

interface Props {
  /** 대표 이미지 URL 목록 (없으면 축제 태그 기반 플레이스홀더) */
  images: string[];
  sample: Festival[];
}

/**
 * 홈 월 카드의 이미지 콜라주.
 * 축제 수에 따라 1장(전체), 2장(좌우), 3장(좌 1 + 우 2), 4장(2x2) 레이아웃을 쓴다.
 */
export default function MonthCollage({ images, sample }: Props) {
  // 콜라주 칸은 작아서 잘려도 괜찮으므로 cover 를 쓰되, 해상도를 위해 원본을 먼저 쓴다
  const cells = sample.slice(0, 4).map((f, i) => ({ src: f.image || images[i] || f.thumbnail || "", tags: f.tags, key: f.id }));
  const n = cells.length;

  if (n === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-4xl dark:from-zinc-800 dark:to-zinc-700">
        <span aria-hidden>🗓️</span>
      </div>
    );
  }

  const layout =
    n === 1
      ? "grid-cols-1 grid-rows-1"
      : n === 2
        ? "grid-cols-2 grid-rows-1"
        : "grid-cols-2 grid-rows-2";

  return (
    <div className={`grid h-full w-full gap-0.5 ${layout}`}>
      {cells.map((c, i) => (
        <div key={c.key} className={`relative overflow-hidden ${n === 3 && i === 0 ? "row-span-2" : ""}`}>
          <FestivalImage src={c.src} alt="" tags={c.tags} sizes="(max-width: 640px) 25vw, 16vw" />
        </div>
      ))}
    </div>
  );
}
