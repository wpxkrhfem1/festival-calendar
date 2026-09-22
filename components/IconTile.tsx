import Image from "next/image";

/**
 * 카테고리·장르 아이콘 타일.
 *
 * 아이콘은 public/icons/*.png (OpenAI 로 만든 뒤 여백을 잘라 256px 로 정리한 것).
 * 배경을 연하게 깔아야 아이콘 자체 색이 산다. 진한 그라데이션 위에 올리면 색이 부딪힌다.
 */

/** 이름 → 아이콘 파일과 배경 색조 */
export const TILE: Record<string, { icon: string; from: string; to: string }> = {
  // 축제 카테고리
  "먹거리": { icon: "food", from: "from-orange-200/60", to: "to-amber-200/60" },
  "불꽃/야경": { icon: "firework", from: "from-violet-200/60", to: "to-fuchsia-200/60" },
  "꽃/자연": { icon: "nature", from: "from-rose-200/60", to: "to-pink-200/60" },
  "문화/전통": { icon: "culture", from: "from-red-200/60", to: "to-orange-200/60" },
  "음악/공연": { icon: "music", from: "from-sky-200/60", to: "to-cyan-200/60" },
  // 공연 장르
  "서양음악(클래식)": { icon: "classic", from: "from-amber-200/60", to: "to-yellow-200/60" },
  "뮤지컬": { icon: "musical", from: "from-fuchsia-200/60", to: "to-violet-200/60" },
  "대중음악": { icon: "pop", from: "from-pink-200/60", to: "to-fuchsia-200/60" },
  "연극": { icon: "play", from: "from-rose-200/60", to: "to-red-200/60" },
  "한국음악(국악)": { icon: "gugak", from: "from-emerald-200/60", to: "to-teal-200/60" },
  "서커스/마술": { icon: "magic", from: "from-sky-200/60", to: "to-blue-200/60" },
  "무용(서양/한국무용)": { icon: "musical", from: "from-purple-200/60", to: "to-fuchsia-200/60" },
  "대중무용": { icon: "pop", from: "from-pink-200/60", to: "to-rose-200/60" },
  "복합": { icon: "magic", from: "from-zinc-200/60", to: "to-slate-200/60" },
};

/** 긴 이름은 타일에 짧게 적는다 */
export const SHORT_NAME: Record<string, string> = {
  "서양음악(클래식)": "클래식",
  "한국음악(국악)": "국악",
  "무용(서양/한국무용)": "무용",
};

export default function IconTile({ name }: { name: string }) {
  const t = TILE[name];
  if (!t) return null;
  return (
    <span
      aria-hidden
      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${t.from} ${t.to} sm:h-14 sm:w-14`}
    >
      {/* 퍼센트 높이는 부모가 flex 라 0 으로 접힌다. 고정 크기로 둔다 */}
      <Image
        src={`/icons/${t.icon}.png`}
        alt=""
        width={48}
        height={48}
        className="h-9 w-9 object-contain sm:h-10 sm:w-10"
      />
    </span>
  );
}
