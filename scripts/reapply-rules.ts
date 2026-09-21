/**
 * 저장된 festivals.json 에 현재 규칙(주소 파싱·태그 분류·걸치는 달)을 다시 적용한다.
 * API 를 호출하지 않으므로 트래픽을 쓰지 않는다. lib/regions.ts 나 lib/tags.ts 를 고친 뒤 실행.
 *
 *   npx tsx scripts/reapply-rules.ts
 */
import fs from "node:fs";
import path from "node:path";
import type { FestivalDataFile } from "../lib/types";
import { parseAddress } from "../lib/regions";
import { classifyTags } from "../lib/tags";
import { monthsBetween } from "../lib/date";

const OUT_PATH = path.join(process.cwd(), "data", "festivals.json");
const data = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as FestivalDataFile;

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

fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`[done] 지역 ${regionChanged}건, 태그 ${tagChanged}건 갱신. 시도 미확인 ${data.festivals.filter((f) => !f.sido).length}건`);
