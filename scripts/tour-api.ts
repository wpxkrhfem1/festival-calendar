/**
 * TourAPI 4.0 (KorService2) 호출 헬퍼
 * - 공식 문서: https://www.data.go.kr/data/15101578/openapi.do
 * - 서비스 키는 환경변수 TOUR_API_KEY (디코딩된 키) 로만 읽는다
 */
import fs from "node:fs";
import path from "node:path";
import type { RawDetailCommon, RawDetailIntro, RawFestivalItem } from "../lib/types";

export const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const APP_NAME = "FestivalCalendar";

/** .env.local / .env 를 직접 읽어 process.env 에 채운다 (dotenv 의존성 없이) */
export function loadEnv(root = process.cwd()): void {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const [, key, rawVal] = m;
      if (process.env[key]) continue; // 이미 설정된 값 우선
      process.env[key] = rawVal.replace(/^["']|["']$/g, "");
    }
  }
}

export function getServiceKey(): string {
  const key = process.env.TOUR_API_KEY?.trim();
  if (!key) {
    throw new Error("TOUR_API_KEY 가 설정되지 않았습니다. .env.local 에 키를 넣어주세요 (README 참고).");
  }
  return key;
}

interface ApiEnvelope<T> {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: {
      items?: { item?: T | T[] } | "";
      numOfRows?: number | string;
      pageNo?: number | string;
      totalCount?: number | string;
    };
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 공통 GET 호출. 실패 시 지수 백오프로 최대 3회 재시도.
 * API 는 오류 시 _type=json 이어도 XML 을 돌려주는 경우가 있어 본문을 검사한다.
 */
export async function callApi<T>(
  operation: string,
  params: Record<string, string | number | undefined>,
): Promise<{ items: T[]; totalCount: number }> {
  const url = new URL(`${BASE_URL}/${operation}`);
  url.searchParams.set("serviceKey", getServiceKey());
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", APP_NAME);
  url.searchParams.set("_type", "json");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} ${operation}: ${text.slice(0, 200)}`);
      if (text.trimStart().startsWith("<")) {
        // XML 오류 응답 (키 미등록, 트래픽 초과 등)
        const msg = text.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>|<resultMsg>([^<]+)<\/resultMsg>|<errMsg>([^<]+)<\/errMsg>/);
        throw new Error(`API 오류(${operation}): ${msg?.[1] ?? msg?.[2] ?? msg?.[3] ?? text.slice(0, 200)}`);
      }
      const json = JSON.parse(text) as ApiEnvelope<T>;
      const header = json.response?.header;
      if (header?.resultCode && header.resultCode !== "0000") {
        throw new Error(`API 오류(${operation}): ${header.resultCode} ${header.resultMsg ?? ""}`);
      }
      const body = json.response?.body;
      const rawItems = body?.items && typeof body.items === "object" ? body.items.item : undefined;
      const items = rawItems === undefined ? [] : Array.isArray(rawItems) ? rawItems : [rawItems];
      return { items, totalCount: Number(body?.totalCount ?? items.length) };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      // 키/권한 오류는 재시도해도 소용없으므로 즉시 중단
      if (/SERVICE KEY|UNREGISTERED|LIMITED NUMBER OF SERVICE REQUESTS EXCEEDS/i.test(msg)) throw err;
      if (attempt < 3) await sleep(500 * 2 ** attempt);
    }
  }
  throw lastError;
}

/** 축제 목록 한 페이지 조회 */
export function searchFestivalPage(opts: {
  eventStartDate: string; // YYYYMMDD
  eventEndDate: string; // YYYYMMDD
  pageNo: number;
  numOfRows: number;
}) {
  return callApi<RawFestivalItem>("searchFestival2", {
    eventStartDate: opts.eventStartDate,
    eventEndDate: opts.eventEndDate,
    pageNo: opts.pageNo,
    numOfRows: opts.numOfRows,
    arrange: "A", // 제목순 정렬 → 페이지 순회 중 순서가 흔들리지 않도록 고정
  });
}

/** 공통 상세 (개요, 홈페이지 등). detailCommon2 는 contentId 외의 파라미터를 거부한다 */
export async function fetchDetailCommon(contentId: string): Promise<RawDetailCommon | null> {
  const { items } = await callApi<RawDetailCommon>("detailCommon2", { contentId });
  return items[0] ?? null;
}

/** 소개 상세 (행사장소, 이용요금 등) */
export async function fetchDetailIntro(contentId: string): Promise<RawDetailIntro | null> {
  const { items } = await callApi<RawDetailIntro>("detailIntro2", { contentId, contentTypeId: 15 });
  return items[0] ?? null;
}
