/**
 * TourAPI 원본 응답 → Festival 정규화
 * fetch 스크립트와 테스트에서 공용으로 사용한다. (Next.js 런타임에서는 쓰지 않음)
 */
import type { Festival, RawDetailCommon, RawDetailIntro, RawFestivalItem } from "./types";
import { fromApiDate, monthsBetween } from "./date";
import { parseAddress } from "./regions";
import { classifyTags } from "./tags";

/** HTML 엔티티 최소 디코딩 */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

/** HTML 태그 제거 + 줄바꿈 정리. <br>는 줄바꿈으로 유지 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  const text = String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();
}

/**
 * homepage 필드는 `<a href="http://..." target="_blank" title="...">http://...</a>` 형태로 온다.
 * href 를 우선 추출하고, 없으면 텍스트에서 URL 을 찾는다.
 */
export function extractUrl(html: string | undefined | null): string {
  if (!html) return "";
  const s = String(html);
  const href = s.match(/href\s*=\s*["']([^"']+)["']/i);
  if (href) return normalizeUrl(href[1]);
  const plain = stripHtml(s).match(/https?:\/\/[^\s"'<>]+/i) ?? stripHtml(s).match(/www\.[^\s"'<>]+/i);
  return plain ? normalizeUrl(plain[0]) : "";
}

function normalizeUrl(u: string): string {
  const t = u.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^www\./i.test(t)) return `https://${t}`;
  return "";
}

/** 전화번호에서 HTML/불필요 문자를 정리 */
export function cleanTel(tel: string | undefined | null): string {
  return stripHtml(tel).replace(/\s*[,\/]\s*/g, ", ").trim();
}

/** 문자열 좌표 → 숫자 (없거나 0이면 undefined) */
function toCoord(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : undefined;
}

/**
 * 목록 항목 + (선택) 상세 응답을 합쳐 Festival 로 변환.
 * 날짜가 없거나 형식이 틀리면 null 을 반환한다 (호출 측에서 제외).
 */
export function normalizeFestival(
  item: RawFestivalItem,
  detail?: RawDetailCommon | null,
  intro?: RawDetailIntro | null,
): Festival | null {
  const startDate = fromApiDate(item.eventstartdate);
  const endDate = fromApiDate(item.eventenddate) ?? startDate;
  if (!startDate || !endDate) return null;

  const title = stripHtml(item.title ?? detail?.title).trim();
  if (!title) return null;

  const address = [item.addr1 ?? detail?.addr1, item.addr2 ?? detail?.addr2]
    .map((s) => stripHtml(s))
    .filter(Boolean)
    .join(" ")
    .trim();
  const { sido, sigungu } = parseAddress(item.addr1 ?? detail?.addr1, item.areacode);

  const overview = stripHtml(detail?.overview);
  const tags = classifyTags(title, overview, startDate);

  const festival: Festival = {
    id: String(item.contentid),
    title,
    startDate,
    endDate,
    sido,
    sigungu,
    address,
    image: (item.firstimage || detail?.firstimage || "").trim(),
    thumbnail: (item.firstimage2 || detail?.firstimage2 || item.firstimage || "").trim(),
    tel: cleanTel(item.tel || detail?.tel),
    homepage: extractUrl(detail?.homepage) || extractUrl(intro?.eventhomepage),
    overview,
    tags,
    months: monthsBetween(startDate, endDate),
    lng: toCoord(item.mapx ?? detail?.mapx),
    lat: toCoord(item.mapy ?? detail?.mapy),
    modifiedTime: item.modifiedtime ? String(item.modifiedtime) : undefined,
  };

  // 부가 정보는 값이 있을 때만 넣어 JSON 을 가볍게 유지
  const place = stripHtml(intro?.eventplace);
  const playtime = stripHtml(intro?.playtime);
  const fee = stripHtml(intro?.usetimefestival);
  const sponsor = [stripHtml(intro?.sponsor1), stripHtml(intro?.sponsor2)].filter(Boolean).join(" / ");
  if (place) festival.place = place;
  if (playtime) festival.playtime = playtime;
  if (fee) festival.fee = fee;
  if (sponsor) festival.sponsor = sponsor;

  return festival;
}
