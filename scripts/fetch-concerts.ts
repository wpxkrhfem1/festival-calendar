/**
 * 공연 데이터 수집 스크립트 (KOPIS)
 *
 *   npx tsx scripts/fetch-concerts.ts [--no-detail] [--max-detail=N] [--dry-run]
 *
 * 1. 오늘 ~ 1년 뒤 범위로 공연목록 전체 페이지 순회 (100건씩)
 * 2. 새로 생겼거나 바뀐 공연만 상세 추가 호출 (출연진·가격·예매처 링크)
 * 3. 정규화 → data/concerts.json 저장
 *
 * 실패 정책: 목록 수집이 실패하면 기존 concerts.json 을 건드리지 않고 exit 1.
 *           상세 호출 개별 실패는 로그만 남기고 기존 상세를 유지한다.
 */
import fs from "node:fs";
import path from "node:path";
import type { Concert, ConcertDataFile, RawKopisListItem } from "../lib/types";
import { normalizeConcert } from "../lib/normalize-concert";
import { fetchConcertDetail, fetchConcertPage, KOPIS_MAX_ROWS } from "./kopis-api";
import { loadEnv } from "./tour-api";

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, "data", "concerts.json");
/** 상세는 1건당 1회 호출이라 한 번에 너무 많이 때리지 않는다 */
const DETAIL_CONCURRENCY = 1; // KOPIS 가 동시 호출에 민감해 직렬로 돌린다 (kopis-api.ts 의 간격 제한기와 함께 동작)
const PAGE_DELAY_MS = 0; // 간격은 kopis-api.ts 의 throttle 이 담당한다

interface Options {
  detail: boolean;
  maxDetail: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { detail: true, maxDetail: 1500, dryRun: false };
  for (const a of argv) {
    if (a === "--no-detail") opts.detail = false;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a.startsWith("--max-detail=")) opts.maxDetail = Math.max(0, Number(a.split("=")[1]) || 0);
  }
  return opts;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadExisting(): ConcertDataFile | null {
  try {
    if (!fs.existsSync(OUT_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as ConcertDataFile;
    return Array.isArray(parsed.concerts) ? parsed : null;
  } catch (err) {
    console.warn("[warn] 기존 concerts.json 을 읽지 못했습니다:", err);
    return null;
  }
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** 전체 페이지 순회 */
async function fetchAllConcerts(stdate: string, eddate: string): Promise<RawKopisListItem[]> {
  const all: RawKopisListItem[] = [];
  const seen = new Set<string>();
  for (let cpage = 1; cpage <= 300; cpage++) {
    const items = await fetchConcertPage({ stdate, eddate, cpage });
    if (cpage % 5 === 1 || items.length < KOPIS_MAX_ROWS) {
      console.log(`[list] page ${cpage}: ${items.length}건 (누적 ${all.length + items.length}건)`);
    }
    for (const it of items) {
      const id = String(it.mt20id ?? "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      all.push(it);
    }
    if (items.length < KOPIS_MAX_ROWS) break;
    await sleep(PAGE_DELAY_MS);
  }
  return all;
}

/** 동시성 제한 실행기 */
async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<void> {
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

async function main() {
  loadEnv(ROOT);
  const opts = parseArgs(process.argv.slice(2));
  const existing = loadExisting();
  const existingById = new Map((existing?.concerts ?? []).map((c) => [c.id, c]));

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const stdate = ymd(today);
  const rangeEnd = new Date(today.getTime() + 365 * 86_400_000);
  const rangeEndIso = rangeEnd.toISOString().slice(0, 10);
  const eddate = ymd(rangeEnd);
  console.log(`[info] 수집 범위 ${stdate} ~ ${eddate}, 기존 ${existingById.size}건`);

  // 1) 목록 수집 — 실패하면 기존 파일 유지
  let items: RawKopisListItem[];
  try {
    items = await fetchAllConcerts(stdate, eddate);
  } catch (err) {
    console.error("[error] 공연 목록 수집 실패. 기존 concerts.json 을 유지합니다.");
    console.error(err);
    process.exit(1);
  }
  if (items.length === 0) {
    console.error("[error] 수집된 공연이 0건입니다. 기존 concerts.json 을 유지합니다.");
    process.exit(1);
  }
  console.log(`[info] 목록 ${items.length}건 수집 완료`);

  // 2) 상세 대상: 아직 상세가 없는 건 우선, 시작일이 빠른 순
  const needsDetail = items
    .filter((it) => {
      const prev = existingById.get(String(it.mt20id));
      return !prev || !prev.updatedAt;
    })
    .sort((a, b) => String(a.prfpdfrom).localeCompare(String(b.prfpdfrom)));
  const targets = opts.detail ? needsDetail.slice(0, opts.maxDetail) : [];
  console.log(`[info] 상세 필요 ${needsDetail.length}건, 이번 실행에서 ${targets.length}건 호출`);

  const details = new Map<string, Awaited<ReturnType<typeof fetchConcertDetail>>>();
  let failures = 0;
  let done = 0;
  await runWithConcurrency(
    targets.map((it) => async () => {
      const id = String(it.mt20id);
      try {
        details.set(id, await fetchConcertDetail(id));
      } catch (err) {
        failures += 1;
        console.warn(`[warn] 상세 실패 ${id}:`, err instanceof Error ? err.message : err);
      }
      done += 1;
      if (done % 200 === 0) console.log(`[detail] ${done}/${targets.length}`);
    }),
    DETAIL_CONCURRENCY,
  );
  if (failures) console.warn(`[warn] 상세 실패 ${failures}건 — 기존 상세를 유지합니다.`);

  // 3) 정규화. 상세를 못 받은 건은 기존 저장분의 상세 필드를 이어받는다
  const concerts: Concert[] = [];
  let skipped = 0;
  for (const it of items) {
    const id = String(it.mt20id);
    // 오픈런 공연은 수년에 걸쳐 있어 수집 범위(오늘~1년)로 잘라 달을 계산한다
    const normalized = normalizeConcert(it, details.get(id), todayIso, rangeEndIso);
    if (!normalized) {
      skipped += 1;
      continue;
    }
    if (!details.has(id)) {
      const prev = existingById.get(id);
      if (prev?.updatedAt) {
        Object.assign(normalized, {
          cast: prev.cast,
          crew: prev.crew,
          runtime: prev.runtime,
          ageLimit: prev.ageLimit,
          price: prev.price,
          timeGuide: prev.timeGuide,
          producer: prev.producer,
          introImages: prev.introImages,
          tickets: prev.tickets,
          updatedAt: prev.updatedAt,
        });
      }
    }
    concerts.push(normalized);
  }
  concerts.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, "ko"));
  const detailCount = concerts.filter((c) => c.updatedAt).length;
  console.log(`[info] 정규화 ${concerts.length}건 (제외 ${skipped}건), 상세 보유 ${detailCount}건`);

  const out: ConcertDataFile = {
    meta: {
      fetchedAt: new Date().toISOString(),
      rangeStart: `${stdate.slice(0, 4)}-${stdate.slice(4, 6)}-${stdate.slice(6, 8)}`,
      rangeEnd: `${eddate.slice(0, 4)}-${eddate.slice(4, 6)}-${eddate.slice(6, 8)}`,
      count: concerts.length,
      detailCount,
      source: "예술경영지원센터 공연예술통합전산망(KOPIS)",
    },
    concerts,
  };

  if (opts.dryRun) {
    console.log("[info] --dry-run: 파일을 저장하지 않습니다.");
    console.log(JSON.stringify(concerts.slice(0, 2), null, 2));
    return;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const tmp = `${OUT_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, OUT_PATH);
  console.log(`[done] ${OUT_PATH} 저장 (${concerts.length}건)`);
  if (needsDetail.length > targets.length) {
    console.log(`[info] 상세 미수집 ${needsDetail.length - targets.length}건은 다음 실행에서 이어서 처리됩니다.`);
  }
}

main().catch((err) => {
  console.error("[error] 예기치 못한 오류:", err);
  process.exit(1);
});
