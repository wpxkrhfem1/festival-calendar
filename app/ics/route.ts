/**
 * 캘린더 파일 내려주기
 *   /ics?f=3481597            축제 하나
 *   /ics?f=1,2,3&c=PF185428   찜 목록 전체
 *
 * 브라우저에서 Blob 으로 만들어 내려받게 할 수도 있지만,
 * iOS 사파리에서 .ics 가 열리지 않는 경우가 있어 서버가 정식 Content-Type 으로 준다.
 */
import { getFestivalById } from "@/lib/festivals";
import { getConcertById } from "@/lib/concerts";
import { buildIcs, icsFileName } from "@/lib/ics";
import { SITE_NAME } from "@/lib/site";
import type { Concert, Festival } from "@/lib/types";

/** 한 번에 담을 수 있는 최대 개수. 주소가 끝없이 길어지는 것을 막는다 */
const MAX_IDS = 200;

function ids(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX_IDS);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const festivals = ids(url.searchParams.get("f"))
    .map(getFestivalById)
    .filter((x): x is Festival => !!x);
  const concerts = ids(url.searchParams.get("c"))
    .map(getConcertById)
    .filter((x): x is Concert => !!x);

  if (festivals.length + concerts.length === 0) {
    return new Response("담을 일정이 없습니다.", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  // 하나만 담으면 그 이름으로, 여러 개면 사이트 이름으로 파일명을 짓는다
  const only = festivals.length + concerts.length === 1;
  const base = only ? (festivals[0]?.title ?? concerts[0]?.title ?? SITE_NAME) : `${SITE_NAME} 일정`;
  const name = icsFileName(base);

  return new Response(buildIcs(festivals, concerts), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      // 한글 파일명은 filename* (RFC 5987) 로 넘긴다
      "content-disposition": `attachment; filename="calendar.ics"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "cache-control": "public, max-age=3600",
    },
  });
}
