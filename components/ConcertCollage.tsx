import type { Concert } from "@/lib/types";
import Collage from "./Collage";
import ConcertPoster from "./ConcertPoster";

/** 공연 홈 월 카드의 포스터 콜라주 */
export default function ConcertCollage({ sample }: { sample: Concert[] }) {
  const cells = sample
    .slice(0, 4)
    .map((c) => (
      <ConcertPoster key={c.id} src={c.poster} alt="" genre={c.genre} sizes="(max-width: 640px) 50vw, 25vw" />
    ));

  return (
    <Collage
      cells={cells}
      empty={
        <span aria-hidden className="text-3xl">
          🎫
        </span>
      }
    />
  );
}
