/**
 * 전국문화축제표준데이터 수집 스크립트
 *
 *   npx tsx scripts/fetch-std-festivals.ts [--dry-run]
 *
 * 관광공사 TourAPI 에 없는 지자체 축제를 채우려고 쓴다. 키는 TOUR_API_KEY 를 그대로 쓴다
 * (공공데이터포털 인증키 하나로 활용신청한 API 를 다 부른다).
 *
 * 1. 1,000건씩 전체 페이지를 받는다 (2026-09-28 기준 1,321건, 2페이지)
 * 2. 변환해서 올해 1/1 ~ 내년 12/31 에 걸치는 것만 남긴다
 * 3. data/festivals-std.json 에 저장. 관광공사 데이터와 겹치는 것은 읽을 때(lib/festivals.ts) 거른다.
 *    관광공사 쪽이 나중에 같은 축제를 올려도 따로 손대지 않게 하려는 것이다.
 *
 * 실패 정책: 받는 도중 실패하면 기존 파일을 건드리지 않고 exit 1.
 */
import fs from "node:fs";
import path from "node:path";
import type { Festival, FestivalDataFile, RawStdFestival } from "../lib/types";
import { dedupeStd, normalizeStdFestival } from "../lib/normalize-std";
import { loadEnv } from "./tour-api";

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, "data", "festivals-std.json");
const ENDPOINT = "https://api.data.go.kr/openapi/tn_pubr_public_cltur_fstvl_api";
const NUM_OF_ROWS = 1000;

interface StdBody {
  header?: { resultCode?: string; resultMsg?: string };
  body?: { totalCount?: string | number; items?: RawStdFestival[] | { item?: RawStdFestival[] } };
}

/** 이 API 는 header/body 가 맨 위에 온다 (response 껍데기 없음, 2026-09-28 확인). 둘 다 받는다 */
interface StdResponse extends StdBody {
  response?: StdBody;
  // 오류일 때는 이 모양으로 온다
  OpenAPI_ServiceResponse?: { cmmMsgHeader?: { errMsg?: string; returnAuthMsg?: string } };
}

async function fetchPage(key: string, pageNo: number): Promise<{ items: RawStdFestival[]; total: number }> {
  const url = `${ENDPOINT}?serviceKey=${encodeURIComponent(key)}&pageNo=${pageNo}&numOfRows=${NUM_OF_ROWS}&type=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as StdResponse;
  const err = json.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (err) throw new Error(`${err.errMsg ?? ""} ${err.returnAuthMsg ?? ""}`.trim());
  const top = json.response ?? json;
  const code = top.header?.resultCode;
  if (code && code !== "00") throw new Error(`resultCode ${code}: ${top.header?.resultMsg ?? ""}`);
  const raw = top.body?.items;
  const items = Array.isArray(raw) ? raw : (raw?.item ?? []);
  return { items, total: Number(top.body?.totalCount ?? 0) };
}

async function main() {
  loadEnv(ROOT);
  const key = process.env.TOUR_API_KEY?.trim();
  if (!key) throw new Error("TOUR_API_KEY 가 없습니다 (.env.local 또는 환경변수)");
  const dryRun = process.argv.includes("--dry-run");

  const raw: RawStdFestival[] = [];
  let total = Infinity;
  for (let page = 1; raw.length < total; page++) {
    const { items, total: t } = await fetchPage(key, page);
    total = t;
    raw.push(...items);
    console.log(`[info] ${page}페이지 ${items.length}건 (누적 ${raw.length}/${total})`);
    if (items.length === 0) break;
  }

  // 0건을 저장하면 사이트에서 이 축제들이 통째로 사라진다. 응답 모양이 바뀌었을 때 실제로 그럴 뻔했다
  if (raw.length === 0) throw new Error("받은 축제가 0건입니다. 기존 파일을 그대로 둡니다.");

  const year = Number(new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 4));
  const rangeStart = `${year}-01-01`;
  const rangeEnd = `${year + 1}-12-31`;
  const converted: Festival[] = [];
  let skipped = 0;
  for (const r of raw) {
    const f = normalizeStdFestival(r);
    if (!f) {
      skipped += 1;
      continue;
    }
    if (f.endDate < rangeStart || f.startDate > rangeEnd) continue;
    converted.push(f);
  }
  // 같은 축제가 두 번 올라온 줄이 있다. 저장 전에 합쳐서 id 가 겹치지 않게 한다
  const festivals = dedupeStd(converted);
  festivals.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, "ko"));
  console.log(`[info] 범위 안 ${converted.length}건 → 중복 합쳐 ${festivals.length}건 (날짜·이름 오류 제외 ${skipped}건)`);

  const out: FestivalDataFile = {
    meta: {
      fetchedAt: new Date().toISOString(),
      rangeStart,
      rangeEnd,
      count: festivals.length,
      source: "문화체육관광부 전국문화축제표준데이터 (tn_pubr_public_cltur_fstvl_api)",
    },
    festivals,
  };
  if (dryRun) {
    console.log("[info] --dry-run: 파일을 저장하지 않습니다.");
    return;
  }
  const tmp = `${OUT_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, OUT_PATH);
  console.log(`[done] ${OUT_PATH} 저장 (${festivals.length}건)`);
}

main().catch((err) => {
  console.error("[error]", err instanceof Error ? err.message : err);
  process.exit(1);
});
