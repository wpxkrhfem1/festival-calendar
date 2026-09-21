/**
 * KOPIS 원본 응답 → Concert 정규화
 * fetch 스크립트와 테스트에서 공용으로 쓴다.
 */
import type { Concert, RawKopisDetail, RawKopisListItem, RawKopisRelate, TicketLink } from "./types";
import { monthsBetween } from "./date";
import { REGIONS } from "./regions";

/** "2026.10.24" → "2026-10-24". 형식이 아니면 null */
export function fromKopisDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

/** KOPIS area("서울특별시") → 짧은 시도명("서울"). 못 찾으면 원문 그대로 */
export function shortSido(area: string | undefined): string {
  const a = (area ?? "").trim();
  if (!a) return "";
  for (const r of REGIONS) {
    if (r.aliases.includes(a) || a.startsWith(r.name)) return r.name;
  }
  return a;
}

/** 공백만 있는 값은 빈 문자열로 (KOPIS 는 빈 필드에 공백 한 칸을 넣어 보낸다) */
function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** 예매처 링크 추출 */
function parseTickets(relates: RawKopisDetail["relates"]): TicketLink[] {
  const list = relates?.relate;
  const arr: RawKopisRelate[] = list === undefined ? [] : Array.isArray(list) ? list : [list];
  return arr
    .map((r) => ({ name: clean(r?.relatenm), url: clean(r?.relateurl) }))
    .filter((t) => t.name && /^https?:\/\//i.test(t.url));
}

/** 소개 이미지 추출 */
function parseIntroImages(styurls: RawKopisDetail["styurls"]): string[] {
  const v = styurls?.styurl;
  const arr = v === undefined ? [] : Array.isArray(v) ? v : [v];
  return arr.map((s) => clean(s)).filter((s) => /^https?:\/\//i.test(s));
}

/**
 * 목록 항목 + (선택) 상세를 합쳐 Concert 로 변환.
 * 날짜가 없거나 형식이 틀리면 null 을 반환한다.
 *
 * monthsFrom / monthsTo: 걸치는 달을 이 구간으로 잘라 계산한다.
 * 오픈런 공연은 2018년에 시작해 2031년까지 이어지는 식이라, 그대로 두면
 * 지난 달과 먼 미래의 달이 수십 개씩 쌓이고 월 페이지에 엉뚱한 연도 탭이 생긴다.
 */
export function normalizeConcert(
  item: RawKopisListItem,
  detail?: RawKopisDetail | null,
  monthsFrom?: string,
  monthsTo?: string,
): Concert | null {
  const startDate = fromKopisDate(item.prfpdfrom ?? detail?.prfpdfrom);
  const endDate = fromKopisDate(item.prfpdto ?? detail?.prfpdto) ?? startDate;
  if (!startDate || !endDate) return null;

  const title = clean(item.prfnm ?? detail?.prfnm);
  if (!title) return null;

  const concert: Concert = {
    id: clean(item.mt20id),
    title,
    startDate,
    endDate,
    genre: clean(item.genrenm ?? detail?.genrenm),
    // 상세의 공연장명이 "김해문화의전당 (누리홀)" 처럼 홀까지 담고 있어 더 정확하다
    venue: clean(detail?.fcltynm || item.fcltynm),
    sido: shortSido(item.area ?? detail?.area),
    poster: clean(item.poster ?? detail?.poster),
    openRun: clean(item.openrun ?? detail?.openrun).toUpperCase() === "Y",
    state: clean(item.prfstate ?? detail?.prfstate),
    months: monthsBetween(
      monthsFrom && monthsFrom > startDate ? monthsFrom : startDate,
      monthsTo && monthsTo < endDate ? monthsTo : endDate,
    ),
  };
  if (!concert.id) return null;

  if (detail) {
    const cast = clean(detail.prfcast);
    const crew = clean(detail.prfcrew);
    const runtime = clean(detail.prfruntime);
    const ageLimit = clean(detail.prfage);
    const price = clean(detail.pcseguidance);
    const timeGuide = clean(detail.dtguidance);
    const producer = clean(detail.entrpsnm);
    const introImages = parseIntroImages(detail.styurls);
    const tickets = parseTickets(detail.relates);
    const updatedAt = clean(detail.updatedate);

    if (cast) concert.cast = cast;
    if (crew) concert.crew = crew;
    if (runtime) concert.runtime = runtime;
    if (ageLimit) concert.ageLimit = ageLimit;
    if (price) concert.price = price;
    if (timeGuide) concert.timeGuide = timeGuide;
    if (producer) concert.producer = producer;
    if (introImages.length) concert.introImages = introImages;
    if (tickets.length) concert.tickets = tickets;
    if (updatedAt) concert.updatedAt = updatedAt;
  }

  return concert;
}
