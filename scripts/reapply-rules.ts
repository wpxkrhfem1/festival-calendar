/**
 * 저장된 데이터에 현재 규칙을 다시 적용한다.
 * API 를 호출하지 않으므로 트래픽을 쓰지 않는다.
 *
 *   npx tsx scripts/reapply-rules.ts
 *
 * - 축제: 주소 파싱(lib/regions.ts), 태그 분류(lib/tags.ts), 걸치는 달
 * - 공연: 걸치는 달을 수집 범위(오늘~1년)로 다시 자른다
 *
 * lib/regions.ts, lib/tags.ts, lib/normalize-concert.ts 를 고친 뒤 실행하면 된다.
 */
import fs from "node:fs";
import path from "node:path";
import type { ConcertDataFile, FestivalDataFile } from "../lib/types";
import { parseAddress } from "../lib/regions";
import { classifyTags } from "../lib/tags";
import { monthsBetween } from "../lib/date";

const ROOT = process.cwd();

function reapplyFestivals(): void {
  const p = path.join(ROOT, "data", "festivals.json");
  if (!fs.existsSync(p)) {
    console.log("[skip] festivals.json 없음");
    return;
  }
  const data = JSON.parse(fs.readFileSync(p, "utf8")) as FestivalDataFile;

  let regionChanged = 0;
  let tagChanged = 0;
  for (const f of data.festivals) {
    const { sido, sigungu } = parseAddress(f.address);
    if (sido && (sido !== f.sido || sigungu !== f.sigungu)) {
      f.sido = sido;
      f.sigungu = sigungu;
      regionChanged += 1;
    }
    const tags = classifyTags(f.title, f.overview, f.startDate);
    if (tags.join("|") !== f.tags.join("|")) {
      f.tags = tags;
      tagChanged += 1;
    }
    f.months = monthsBetween(f.startDate, f.endDate);
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(
    `[축제] 지역 ${regionChanged}건, 태그 ${tagChanged}건 갱신. 시도 미확인 ${data.festivals.filter((f) => !f.sido).length}건`,
  );
}

function reapplyConcerts(): void {
  const p = path.join(ROOT, "data", "concerts.json");
  if (!fs.existsSync(p)) {
    console.log("[skip] concerts.json 없음");
    return;
  }
  const data = JSON.parse(fs.readFileSync(p, "utf8")) as ConcertDataFile;

  // 수집 범위: 파일의 meta 를 신뢰하되, 없으면 오늘~1년으로 본다
  const today = new Date().toISOString().slice(0, 10);
  const from = data.meta?.rangeStart && data.meta.rangeStart > today ? data.meta.rangeStart : today;
  const to =
    data.meta?.rangeEnd ?? new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);

  let changed = 0;
  for (const c of data.concerts) {
    const months = monthsBetween(
      from > c.startDate ? from : c.startDate,
      to < c.endDate ? to : c.endDate,
    );
    if (months.join("|") !== c.months.join("|")) {
      c.months = months;
      changed += 1;
    }
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  const years = new Set(data.concerts.flatMap((c) => c.months.map((m) => m.slice(0, 4))));
  console.log(`[공연] 달 범위 ${changed}건 갱신 (범위 ${from} ~ ${to}). 존재하는 연도: ${[...years].sort().join(", ")}`);
}

reapplyFestivals();
reapplyConcerts();
