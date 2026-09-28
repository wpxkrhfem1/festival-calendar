import { formatKoreanDate, freshnessOf } from "@/lib/date";

interface Props {
  /** 관광공사 쪽 마지막 수정일 (YYYY-MM-DD). 모르면 null */
  modified: string | null;
  today: string;
  /** 공식 홈페이지. 없으면 검색 주소를 대신 넘긴다 */
  homepageUrl: string;
  hasHomepage: boolean;
  /** 전화 걸기에 쓸 번호. 못 뽑았으면 null */
  dial: string | null;
  /** 일정 변경 제보 주소 */
  reportUrl: string;
}

/**
 * "가기 전에 꼭 확인하세요" 안내.
 *
 * 이 사이트의 축제 정보는 실시간이 아니다. 관광공사 데이터의 마지막 수정일
 * 중앙값이 18일 전이었고, 사흘 안에 고쳐진 축제는 0건이었다. 우천 취소나
 * 당일 연기는 절대 여기 먼저 뜨지 않는다.
 *
 * 그 사실을 페이지 맨 아래 한 줄로만 적어 두면 아무도 안 읽는다. 그래서
 * 정보가 언제 것인지 보여주고, 확인할 곳(홈페이지·전화)을 바로 옆에 둔다.
 * 오래된 정보일수록 색을 진하게 해 눈에 띄게 한다.
 */
export default function VerifyNotice({ modified, today, homepageUrl, hasHomepage, dial, reportUrl }: Props) {
  const { level, days } = freshnessOf(modified, today);
  // "7월 22일 (수)" 의 요일은 뺀다. 문장 안에서 괄호가 겹쳐 읽기 어렵다
  const date = modified ? formatKoreanDate(modified).replace(/\s*\(.\)$/, "") : "";

  const box =
    level === "fresh"
      ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
      : level === "aging"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20"
        : "border-amber-300 bg-amber-50 dark:border-amber-800/70 dark:bg-amber-950/30";

  const when =
    modified === null
      ? "언제 갱신된 정보인지 알 수 없어요."
      : level === "fresh"
        ? `관광공사 정보 · ${date} 갱신.`
        : `이 정보는 ${days}일 전(${date})에 마지막으로 갱신됐어요.`;

  return (
    <section aria-label="방문 전 확인 안내" className={`mt-5 rounded-2xl border p-4 ${box}`}>
      <p className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">가기 전에 꼭 확인하세요</p>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        {when} 취소나 연기는 여기 바로 반영되지 않아요.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={homepageUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          data-goatcounter-click="verify-homepage"
          className="rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {hasHomepage ? "공식 홈페이지에서 확인" : "네이버에서 확인"}
        </a>
        {dial && (
          <a
            href={`tel:${dial}`}
            data-goatcounter-click="verify-call"
            className="rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-800 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            전화로 확인 {dial}
          </a>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        일정이 바뀐 걸 아시나요?{" "}
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-goatcounter-click="report-change"
          className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-300"
        >
          알려주기
        </a>{" "}
        (GitHub 로그인 필요)
      </p>
    </section>
  );
}
