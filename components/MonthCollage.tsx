import type { Festival } from "@/lib/types";
import Collage from "./Collage";
import FestivalImage from "./FestivalImage";

interface Props {
  /** 대표 이미지 URL 목록 (없으면 축제 태그 기반 플레이스홀더) */
  images: string[];
  sample: Festival[];
}

/** 홈 월 카드의 축제 이미지 콜라주 */
export default function MonthCollage({ images, sample }: Props) {
  const cells = sample.slice(0, 4).map((f, i) => (
    <FestivalImage
      key={f.id}
      src={f.image || images[i] || f.thumbnail || ""}
      alt=""
      tags={f.tags}
      sizes="(max-width: 640px) 50vw, 25vw"
    />
  ));

  return <Collage cells={cells} />;
}
