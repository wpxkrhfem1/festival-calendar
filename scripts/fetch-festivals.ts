/**
 * 축제 데이터 수집 스크립트
 *
 *   npx tsx scripts/fetch-festivals.ts [--no-detail] [--max-detail=N] [--dry-run]
 *
 * 1. 올해 1/1 ~ 내년 12/31 범위로 searchFestival2 전체 페이지 순회
 * 2. 새로 생겼거나 modifiedtime 이 바뀐 축제만 detailCommon2 / detailIntro2 추가 호출
 *    상세 1건당 API 3회(공통+소개+사진) 호출한다.
 *    (일일 트래픽 제한 보호: --max-detail 로 상한, 기본 300건. 나머지는 기존 상세 재사용)
 * 3. 정규화 + 태그 분류 → data/festivals.json 저장
 *
 * 실패 정책: 목록 수집이 실패하면 기존 festivals.json 을 건드리지 않고 exit 1.
 *           상세 호출 개별 실패는 로그만 남기고 기존 상세를 유지한다.
 */
import fs from "node:fs";
import path from "node:path";
import type { Festival, FestivalDataFile, RawDetailCommon, RawDetailIntro, RawFestivalItem } from "../lib/types";
import { normalizeFestival } from "../lib/normalize";
import { fetchDetailCommon, fetchDetailImages, fetchDetailIntro, loadEnv, searchFestivalPage } from "./tour-api";

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, "data", "festivals.json");
const NUM_OF_ROWS = 500; // 페이지 수를 최소화하기 위해 크게
const DETAIL_CONCURRENCY = 4;

interface Options {
  detail: boolean;
  maxDetail: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { detail: true, maxDetail: 300, dryRun: false };
  for (const a of argv) {
    if (a === "--no-detail") opts.detail = false;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a.startsWith("--max-detail=")) opts.maxDetail = Math.max(0, Number(a.split("=")[1]) || 0);
  }
  return opts;
}

/** 기존 festivals.json 읽기 (없으면 null) */
function loadExisting(): FestivalDataFile | null {
  try {
    if (!fs.existsSync(OUT_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as FestivalDataFile;
    return Array.isArray(parsed.festivals) ? parsed : null;
  } catch (err) {
    console.warn("[warn] 기존 festivals.json 을 읽지 못했습니다:", err);
    return null;
  }
}

/** 전체 페이지 순회 */
async function fetchAllFestivals(rangeStart: string, rangeEnd: string): Promise<RawFestivalItem[]> {
  const all: RawFestivalItem[] = [];
  let pageNo = 1;
  let totalCount = Infinity;
  while (all.length < totalCount) {
    const { items, totalCount: tc } = await searchFestivalPage({
      eventStartDate: rangeStart,
      eventEndDate: rangeEnd,
      pageNo,
      numOfRows: NUM_OF_ROWS,
    });
    totalCount = tc;
    console.log(`[list] page ${pageNo}: ${items.length}건 (총 ${totalCount}건)`);
    if (items.length === 0) break;
    all.push(...items);
    pageNo += 1;
    if (pageNo > 50) {
      console.warn("[warn] 페이지가 50을 넘어 순회를 중단합니다.");
      break;
    }
  }
  // contentid 중복 제거
  const seen = new Set<string>();
  return all.filter((it) => {
    const id = String(it.contentid);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** 동시성 제한 실행기 */
async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

async function main() {
  loadEnv(ROOT);
  const opts = parseArgs(process.argv.slice(2));
  const existing = loadExisting();
  const existingById = new Map((existing?.festivals ?? []).map((f) => [f.id, f]));

  const year = new Date().getFullYear();
  const rangeStart = `${year}0101`;
  const rangeEnd = `${year + 1}1231`;
  console.log(`[info] 수집 범위 ${rangeStart} ~ ${rangeEnd}, 기존 ${existingById.size}건`);

  // 1) 목록 수집 — 여기서 실패하면 기존 파일 유지
  let items: RawFestivalItem[];
  try {
    items = await fetchAllFestivals(rangeStart, rangeEnd);
  } catch (err) {
    console.error("[error] 축제 목록 수집 실패. 기존 festivals.json 을 유지합니다.");
    console.error(err);
    process.exit(1);
  }
  if (items.length === 0) {
    console.error("[error] 수집된 축제가 0건입니다. 기존 festivals.json 을 유지합니다.");
    process.exit(1);
  }
  console.log(`[info] 목록 ${items.length}건 수집 완료`);

  // 2) 상세 호출 대상 선정: 신규 or 수정시각 변경, 시작일이 빠른 순으로 우선
  const needsDetail = items
    .filter((it) => {
      const prev = existingById.get(String(it.contentid));
      if (!prev) return true;
      if (!prev.overview && !prev.homepage) return true; // 이전 실행에서 상세를 못 받은 건
      return (prev.modifiedTime ?? "") !== String(it.modifiedtime ?? "");
    })
    .sort((a, b) => String(a.eventstartdate).localeCompare(String(b.eventstartdate)));
  const detailTargets = opts.detail ? needsDetail.slice(0, opts.maxDetail) : [];
  console.log(`[info] 상세 갱신 필요 ${needsDetail.length}건, 이번 실행에서 ${detailTargets.length}건 호출`);

  const details = new Map<string, { common: RawDetailCommon | null; intro: RawDetailIntro | null; photos: string[] }>();
  let detailFailures = 0;
  await runWithConcurrency(
    detailTargets.map((it) => async () => {
      const id = String(it.contentid);
      try {
        // 사진은 없는 축제도 많아 실패해도 나머지는 살린다
        const [common, intro, photos] = await Promise.all([
          fetchDetailCommon(id),
          fetchDetailIntro(id),
          fetchDetailImages(id).catch(() => []),
        ]);
        details.set(id, { common, intro, photos });
      } catch (err) {
        detailFailures += 1;
        console.warn(`[warn] 상세 실패 ${id} (${it.title}):`, err instanceof Error ? err.message : err);
      }
    }),
    DETAIL_CONCURRENCY,
  );
  if (detailFailures) console.warn(`[warn] 상세 실패 ${detailFailures}건 — 기존 상세를 유지합니다.`);

  // 3) 정규화. 상세를 못 받은 건은 기존 저장분의 상세 필드를 이어받는다
  const festivals: Festival[] = [];
  let skipped = 0;
  for (const it of items) {
    const id = String(it.contentid);
    const d = details.get(id);
    const normalized = normalizeFestival(it, d?.common, d?.intro, d?.photos);
    if (!normalized) {
      skipped += 1;
      continue;
    }
    if (!d) {
      const prev = existingById.get(id);
      if (prev) {
        normalized.overview = prev.overview;
        normalized.homepage = prev.homepage;
        if (prev.place) normalized.place = prev.place;
        if (prev.playtime) normalized.playtime = prev.playtime;
        if (prev.fee) normalized.fee = prev.fee;
        if (prev.sponsor) normalized.sponsor = prev.sponsor;
        if (prev.program) normalized.program = prev.program;
        if (prev.photos?.length) normalized.photos = prev.photos;
        // 개요가 있어야 태그가 정확하므로 다시 분류
        normalized.tags = normalizeFestival(it, { contentid: id, overview: prev.overview })!.tags;
      }
    }
    festivals.push(normalized);
  }
  festivals.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title, "ko"));
  console.log(`[info] 정규화 ${festivals.length}건 (날짜 누락 등 제외 ${skipped}건)`);

  const out: FestivalDataFile = {
    meta: {
      fetchedAt: new Date().toISOString(),
      rangeStart: `${year}-01-01`,
      rangeEnd: `${year + 1}-12-31`,
      count: festivals.length,
      source: "한국관광공사 TourAPI 4.0 (KorService2/searchFestival2)",
    },
    festivals,
  };

  if (opts.dryRun) {
    console.log("[info] --dry-run: 파일을 저장하지 않습니다.");
    console.log(JSON.stringify(festivals.slice(0, 2), null, 2));
    return;
  }

  // 원자적 저장 (임시 파일 → 교체)
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const tmp = `${OUT_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, OUT_PATH);
  console.log(`[done] ${OUT_PATH} 저장 (${festivals.length}건)`);
  if (needsDetail.length > detailTargets.length) {
    console.log(`[info] 상세 미갱신 ${needsDetail.length - detailTargets.length}건은 다음 실행에서 이어서 처리됩니다.`);
  }
}

main().catch((err) => {
  console.error("[error] 예기치 못한 오류:", err);
  process.exit(1);
});
