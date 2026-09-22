/**
 * 날짜 유틸리티
 * - 모든 날짜는 "YYYY-MM-DD" 문자열로 다루고, 한국 시간(KST) 기준으로 오늘을 계산한다.
 * - 서버(Vercel, UTC)와 브라우저가 서로 다른 시간대여도 같은 "오늘"을 보도록 KST 고정.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** KST 기준 오늘 날짜를 "YYYY-MM-DD"로 반환 */
export function todayKST(now: Date = new Date()): string {
  // UTC+9 로 밀어서 날짜 부분만 사용
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → { year, month, day } */
export function parseDate(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m, day: d };
}

/** "YYYYMMDD" (TourAPI 형식) → "YYYY-MM-DD". 형식이 맞지 않으면 null */
export function fromApiDate(raw: string | number | undefined | null): string | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (!/^\d{8}$/.test(s)) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  // 실제 존재하는 날짜인지 검사 (예: 2월 30일 방지)
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

/** 요일 계산 (UTC 기준으로 계산해도 날짜만 쓰므로 안전) */
export function weekdayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return WEEKDAYS[d.getUTCDay()];
}

/** "2026-09-21" → "9월 21일 (일)" */
export function formatKoreanDate(iso: string, withYear = false): string {
  const { year, month, day } = parseDate(iso);
  const base = `${month}월 ${day}일 (${weekdayOf(iso)})`;
  return withYear ? `${year}년 ${base}` : base;
}

/**
 * 기간 표기.
 * - 같은 날: "9월 21일 (일)"
 * - 같은 해: "9월 21일 (일) ~ 10월 5일 (월)"
 * - 해가 다르면 양쪽에 연도 표기
 */
export function formatPeriod(start: string, end: string): string {
  if (start === end) return formatKoreanDate(start);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatKoreanDate(start, !sameYear)} ~ ${formatKoreanDate(end, !sameYear)}`;
}

/** 두 날짜의 일수 차이 (b - a) */
export function diffDays(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86_400_000);
}

export type FestivalStatus = "upcoming" | "ongoing" | "ended";

/** 상설 공연·전시로 볼 기준 (일). 이보다 길게 이어지면 목록에서 뒤로 보내고 "상설" 표시 */
export const LONG_RUNNING_DAYS = 120;

/** 120일 이상 이어지는 상설성 행사 여부 */
export function isLongRunning(start: string, end: string): boolean {
  return diffDays(start, end) >= LONG_RUNNING_DAYS;
}

/** 오늘 기준 상태 */
export function statusOf(start: string, end: string, today: string): FestivalStatus {
  if (today < start) return "upcoming";
  if (today > end) return "ended";
  return "ongoing";
}

/**
 * D-day 문구
 * - 시작 전: "D-7" / 시작 당일 "D-Day"
 * - 진행 중: "진행 중 · 3일 남음" (종료일 당일이면 "오늘 마지막")
 * - 종료: "종료"
 */
export function dDayLabel(start: string, end: string, today: string): string {
  if (today === start) return "D-Day"; // 시작 당일
  const status = statusOf(start, end, today);
  if (status === "upcoming") {
    const d = diffDays(today, start);
    return d === 0 ? "D-Day" : `D-${d}`;
  }
  if (status === "ended") return "종료";
  const left = diffDays(today, end);
  return left === 0 ? "오늘 마지막" : `진행 중 · ${left}일 남음`;
}

/**
 * 시작~종료 사이에 걸쳐 있는 모든 달을 "YYYY-MM" 배열로 반환.
 * 예) 2026-12-20 ~ 2027-01-05 → ["2026-12", "2027-01"]
 */
export function monthsBetween(start: string, end: string): string[] {
  const s = parseDate(start);
  const e = parseDate(end);
  const out: string[] = [];
  let y = s.year;
  let m = s.month;
  // 비정상 데이터(종료 < 시작)면 시작 달만
  if (end < start) return [monthKey(y, m)];
  while (y < e.year || (y === e.year && m <= e.month)) {
    out.push(monthKey(y, m));
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    // 안전장치: 5년 이상 걸친 이상 데이터 차단
    if (out.length > 60) break;
  }
  return out;
}

/** 시작 월 기준 계절 */
export function seasonOfMonth(month: number): "봄" | "여름" | "가을" | "겨울" {
  if (month >= 3 && month <= 5) return "봄";
  if (month >= 6 && month <= 8) return "여름";
  if (month >= 9 && month <= 11) return "가을";
  return "겨울";
}

/**
 * /month/[1-12] 페이지가 가리키는 연도.
 * 이번 달 이후(이번 달 포함)는 올해, 이미 지난 달은 내년으로 해석한다.
 * 예) 오늘 2026-09-21: 10월 → 2026, 3월 → 2027
 */
export function targetYearForMonth(month: number, today: string): number {
  const { year, month: nowMonth } = parseDate(today);
  return month >= nowMonth ? year : year + 1;
}

/** "YYYY-MM" 키 생성 */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** 날짜에 일수를 더한다 */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 그 달의 마지막 날 */
export function endOfMonth(iso: string): string {
  const { year, month } = parseDate(iso);
  const d = new Date(Date.UTC(year, month, 0));
  return d.toISOString().slice(0, 10);
}

/** 찾아보기에서 고를 수 있는 시기 */
export type WhenKey = "all" | "ongoing" | "weekend" | "thisMonth" | "nextMonth" | "upcoming" | "custom";

export const WHEN_LABELS: Record<WhenKey, string> = {
  all: "시기 전체",
  ongoing: "지금 진행 중",
  weekend: "이번 주말",
  thisMonth: "이번 달",
  nextMonth: "다음 달",
  upcoming: "앞으로 열려요",
  custom: "날짜 직접 고르기",
};

/** YYYY-MM-DD 이면서 실제로 존재하는 날인지 */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/**
 * 직접 고른 날짜 구간.
 *
 * 시기 필터가 "이번 주말", "다음 달" 같은 고정 선택지뿐이라
 * "10월 3일~5일 연휴에 갈 곳" 처럼 날짜를 정해놓고 찾을 수가 없었다.
 *
 * 한쪽만 고르면 그날 하루로 본다. 거꾸로 골랐으면 뒤집어서 받아준다.
 * 둘 다 비어 있거나 형식이 틀리면 null (구간 제한 없음).
 */
export function customRange(from: string, to: string): { from: string; to: string } | null {
  const a = isIsoDate(from) ? from : "";
  const b = isIsoDate(to) ? to : "";
  if (!a && !b) return null;
  if (a && !b) return { from: a, to: a };
  if (!a && b) return { from: b, to: b };
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

/**
 * 시기 → 날짜 구간 [시작, 끝]. null 이면 구간 제한 없음.
 * 주말은 이번 주 금~일로 본다 (금요일 저녁부터 움직이는 사람이 많다).
 */
export function whenRange(when: WhenKey, today: string): { from: string; to: string } | null {
  switch (when) {
    case "ongoing":
      return { from: today, to: today };
    case "weekend": {
      const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=일 ... 6=토
      // 일요일이면 오늘까지가 이번 주말, 그 외에는 다가오는 금~일
      const toFriday = dow === 0 ? -2 : 5 - dow;
      return { from: addDays(today, Math.max(toFriday, 0) === 0 && dow === 0 ? -2 : toFriday), to: addDays(today, dow === 0 ? 0 : 7 - dow) };
    }
    case "thisMonth":
      return { from: today, to: endOfMonth(today) };
    case "nextMonth": {
      const first = addDays(endOfMonth(today), 1);
      return { from: first, to: endOfMonth(first) };
    }
    case "upcoming":
      return { from: today, to: "9999-12-31" };
    default:
      return null;
  }
}

/** 주소창 파라미터(when/from/to) → 날짜 구간. 축제·공연 찾기 페이지가 같이 쓴다 */
export function rangeFromParams(
  when: WhenKey,
  from: string,
  to: string,
  today: string,
): { from: string; to: string } | null {
  return when === "custom" ? customRange(from, to) : whenRange(when, today);
}

/** 화면에 적을 시기 이름. 직접 고른 구간은 날짜를 그대로 보여준다 */
export function whenLabel(when: WhenKey, range: { from: string; to: string } | null): string | null {
  if (when !== "custom") return when === "all" ? null : WHEN_LABELS[when];
  if (!range) return null;
  return range.from === range.to
    ? formatKoreanDate(range.from)
    : `${formatKoreanDate(range.from)} ~ ${formatKoreanDate(range.to)}`;
}

/** 기간이 구간과 겹치는지 */
export function overlaps(start: string, end: string, range: { from: string; to: string } | null): boolean {
  if (!range) return true;
  return start <= range.to && end >= range.from;
}

/**
 * 현재 달부터 한 바퀴 도는 월 번호 배열.
 * 예) 9월이면 [9,10,11,12,1,2,3,4,5,6,7,8]
 *
 * 데이터가 오늘 이후만 있는 목록(공연)은 1월부터 늘어놓으면 빈 달이 앞에 오므로
 * 이 순서로 보여준다.
 */
export function monthsFromCurrent(nowMonth: number): number[] {
  return Array.from({ length: 12 }, (_, i) => ((nowMonth - 1 + i) % 12) + 1);
}
