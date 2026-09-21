/**
 * KOPIS(공연예술통합전산망) 오픈API 호출 헬퍼
 * - 공식 문서: https://kopis.or.kr/por/cs/openapi/openApiList.do?menuId=MNU_00074
 * - 공공데이터포털이 아니라 KOPIS 자체 서버를 쓰고, 키 파라미터 이름도 service 다
 * - 응답은 XML 만 제공한다
 */
import { XMLParser } from "fast-xml-parser";
import type { RawKopisDetail, RawKopisListItem } from "../lib/types";

export const KOPIS_BASE = "http://www.kopis.or.kr/openApi/restful/pblprfr";
/** 문서상 한 번에 최대 100건 */
export const KOPIS_MAX_ROWS = 100;

/** 장르코드 → 장르명. 2026-09 실제 호출로 검증한 값 */
export const GENRE_CODES: Record<string, string> = {
  AAAA: "연극",
  BBBC: "무용(서양/한국무용)",
  BBBE: "대중무용",
  CCCA: "서양음악(클래식)",
  CCCC: "한국음악(국악)",
  CCCD: "대중음악",
  EEEA: "복합",
  EEEB: "서커스/마술",
  GGGA: "뮤지컬",
};

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false, // 날짜·코드가 숫자로 바뀌지 않게
  trimValues: true,
});

export function getKopisKey(): string {
  const key = process.env.KOPIS_API_KEY?.trim();
  if (!key) {
    throw new Error("KOPIS_API_KEY 가 설정되지 않았습니다. .env.local 에 키를 넣어주세요 (README 참고).");
  }
  return key;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 배열이 아닐 수 있는 응답을 항상 배열로 맞춘다 */
export function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * 호출 간격 제한기.
 * KOPIS 는 빠르게 연속 호출하면 "Request Blocked" 400 을 돌려주고 한동안 막는다.
 * 실제 수집에서 확인한 동작이라, 모든 요청이 최소 간격을 두고 나가도록 직렬화한다.
 */
const MIN_INTERVAL_MS = 320;
let gate: Promise<void> = Promise.resolve();

function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = gate.then(fn);
  // 성공하든 실패하든 다음 호출은 최소 간격 뒤에 나가게 한다
  gate = run.then(
    () => sleep(MIN_INTERVAL_MS).then(() => undefined),
    () => sleep(MIN_INTERVAL_MS).then(() => undefined),
  );
  return run;
}

/** 차단당했을 때 쉬는 시간 (점점 늘린다) */
const BLOCKED_BACKOFF_MS = [5_000, 15_000, 40_000, 90_000];

/**
 * 공통 GET. 인증 오류는 즉시 중단하고, 차단·일시 오류는 충분히 쉬었다가 재시도한다.
 */
async function callKopis(path: string, params: Record<string, string | number | undefined>): Promise<unknown> {
  const url = new URL(path);
  url.searchParams.set("service", getKopisKey());
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const xml = await throttle(async () => {
        const res = await fetch(url, { headers: { Accept: "application/xml" } });
        const body = await res.text();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 160).replace(/\s+/g, " ")}`);
        return body;
      });
      if (/SERVICE KEY IS NOT REGISTERED|INVALID REQUEST PARAMETER/i.test(xml)) {
        throw new Error(`KOPIS 인증/파라미터 오류: ${xml.slice(0, 200)}`);
      }
      return parser.parse(xml);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (/인증\/파라미터/.test(msg)) throw err;
      const wait = BLOCKED_BACKOFF_MS[attempt] ?? 90_000;
      if (attempt < 4) {
        if (/Request Blocked|HTTP 429/i.test(msg)) {
          console.warn(`[kopis] 차단됨 — ${wait / 1000}초 쉬고 재시도합니다`);
        }
        await sleep(wait);
      }
    }
  }
  throw lastError;
}

/** 공연목록 한 페이지 */
export async function fetchConcertPage(opts: {
  stdate: string; // YYYYMMDD
  eddate: string;
  cpage: number;
  rows?: number;
  shcate?: string;
  /** 이 날짜 이후 등록·수정된 항목만 (증분 갱신용) */
  afterdate?: string;
}): Promise<RawKopisListItem[]> {
  const json = (await callKopis(KOPIS_BASE, {
    stdate: opts.stdate,
    eddate: opts.eddate,
    cpage: opts.cpage,
    rows: opts.rows ?? KOPIS_MAX_ROWS,
    shcate: opts.shcate,
    afterdate: opts.afterdate,
  })) as { dbs?: { db?: RawKopisListItem | RawKopisListItem[] } | "" };

  const dbs = json.dbs;
  if (!dbs || typeof dbs !== "object") return [];
  return toArray(dbs.db);
}

/** 공연상세 */
export async function fetchConcertDetail(id: string): Promise<RawKopisDetail | null> {
  const json = (await callKopis(`${KOPIS_BASE}/${id}`, {})) as {
    dbs?: { db?: RawKopisDetail | RawKopisDetail[] } | "";
  };
  const dbs = json.dbs;
  if (!dbs || typeof dbs !== "object") return null;
  return toArray(dbs.db)[0] ?? null;
}
