/**
 * 캘린더 파일(.ics) 만들기
 *
 * 찜하기는 우리 사이트를 다시 열어야 기억나지만, 캘린더에 넣으면
 * 그날이 오기 전에 기기가 알아서 알려준다. 그래서 하루 전 알람(VALARM)까지 넣는다.
 *
 * RFC 5545 를 따른다. 특히 두 가지를 놓치기 쉽다.
 *  - 종일 일정의 DTEND 는 "끝난 다음 날" 이다. 그대로 넣으면 마지막 날이 빠진다.
 *  - 한 줄은 75옥텟을 넘기면 안 된다. 한글은 글자당 3바이트라 금방 넘는다.
 */
import type { Concert, Festival } from "./types";
import { SITE_NAME, SITE_URL } from "./site";

/** 텍스트 값 이스케이프 (역슬래시·세미콜론·쉼표·줄바꿈) */
function esc(value: string): string {
  return (value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** "2026-10-01" → "20261001" */
function ymd(iso: string): string {
  return iso.replace(/-/g, "");
}

/** 종일 일정의 DTEND. 끝난 다음 날을 가리켜야 마지막 날이 포함된다 */
function endExclusive(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return ymd(d.toISOString().slice(0, 10));
}

/**
 * 75옥텟 접기. 이어지는 줄은 공백 한 칸으로 시작한다.
 * 글자 중간에서 자르면 한글이 깨지므로 코드포인트 단위로 세면서 바이트를 센다.
 */
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    // 이어지는 줄은 맨 앞 공백 1바이트를 이미 쓴다
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += size;
  }
  out.push(cur);
  return out.map((s, i) => (i === 0 ? s : ` ${s}`)).join("\r\n");
}

interface EventInput {
  uid: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  url: string;
}

function toEvent(e: EventInput, stamp: string): string[] {
  return [
    "BEGIN:VEVENT",
    fold(`UID:${e.uid}`),
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(e.startDate)}`,
    `DTEND;VALUE=DATE:${endExclusive(e.endDate)}`,
    fold(`SUMMARY:${esc(e.title)}`),
    ...(e.location ? [fold(`LOCATION:${esc(e.location)}`)] : []),
    ...(e.description ? [fold(`DESCRIPTION:${esc(e.description)}`)] : []),
    fold(`URL:${e.url}`),
    "TRANSP:TRANSPARENT",
    // 하루 전 알림. 이게 이 기능의 핵심이라 기본으로 넣는다
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P1D",
    fold(`DESCRIPTION:${esc(`내일 ${e.title}`)}`),
    "END:VALARM",
    "END:VEVENT",
  ];
}

/**
 * TourAPI 개요 맨 앞에 붙는 안내문을 걷어낸다.
 * "*하기 축제장 먹거리 내용은 전년도 축제 내용으로…*" 같은 문장이 그대로 들어가면
 * 캘린더에서 축제 설명 자리에 이 공지부터 보인다.
 */
function cleanOverview(text: string): string {
  return (text ?? "").replace(/^\s*\*[^*]*\*\s*/, "").trim();
}

function festivalEvent(f: Festival): EventInput {
  const region = [f.sido, f.sigungu].filter(Boolean).join(" ");
  return {
    uid: `festival-${f.id}@jeonguk-chukje`,
    title: f.title,
    startDate: f.startDate,
    endDate: f.endDate,
    location: f.address || f.place || region,
    description: [cleanOverview(f.overview).slice(0, 300), f.homepage].filter(Boolean).join("\n\n"),
    url: `${SITE_URL}/festival/${f.id}`,
  };
}

function concertEvent(c: Concert): EventInput {
  return {
    uid: `concert-${c.id}@jeonguk-chukje`,
    title: c.title,
    startDate: c.startDate,
    endDate: c.endDate,
    location: c.venue || c.sido,
    description: [c.cast ? `출연 ${c.cast}` : "", c.genre].filter(Boolean).join("\n"),
    url: `${SITE_URL}/concert/${c.id}`,
  };
}

/** 축제·공연 목록을 하나의 .ics 문서로 */
export function buildIcs(festivals: Festival[], concerts: Concert[], now = new Date()): string {
  const stamp = `${now.toISOString().slice(0, 19).replace(/[-:]/g, "")}Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//KO`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${esc(SITE_NAME)}`),
    ...festivals.flatMap((f) => toEvent(festivalEvent(f), stamp)),
    ...concerts.flatMap((c) => toEvent(concertEvent(c), stamp)),
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/** 파일명에 쓸 수 있게 다듬기 (공백·특수문자 제거). 한글은 브라우저가 처리하므로 그대로 둔다 */
export function icsFileName(base: string): string {
  const safe = base.replace(/[\\/:*?"<>|]/g, "").trim() || "일정";
  return `${safe}.ics`;
}
