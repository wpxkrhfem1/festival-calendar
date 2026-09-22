/**
 * 태그 분류 결과를 눈으로 검사한다 (개발 보조).
 *   npx tsx scripts/check-tags.ts [태그명]
 *
 * 저장된 태그와 현재 규칙의 결과를 비교하고, 태그별 제목을 뽑아준다.
 * 분류 규칙을 고칠 때마다 이걸로 확인한다.
 */
import fs from "node:fs";
import path from "node:path";
import type { FestivalDataFile } from "../lib/types";
import { classifyTags, CATEGORY_TAGS } from "../lib/tags";
import { todayKST } from "../lib/date";

const data = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "festivals.json"), "utf8"),
) as FestivalDataFile;

const today = todayKST();
const upcoming = data.festivals.filter((f) => f.endDate >= today);

const before: Record<string, number> = {};
const after: Record<string, number> = {};
for (const f of upcoming) {
  for (const t of f.tags) if (CATEGORY_TAGS.includes(t as never)) before[t] = (before[t] ?? 0) + 1;
  for (const t of classifyTags(f.title, f.overview, f.startDate)) {
    if (CATEGORY_TAGS.includes(t as never)) after[t] = (after[t] ?? 0) + 1;
  }
}

console.log(`진행 중·예정 축제 ${upcoming.length}건 기준\n`);
console.log("태그        저장된 값 → 새 규칙");
for (const t of CATEGORY_TAGS) {
  console.log(`${t.padEnd(10)} ${String(before[t] ?? 0).padStart(5)} → ${String(after[t] ?? 0).padStart(5)}`);
}
const none = upcoming.filter((f) => classifyTags(f.title, f.overview, f.startDate).every((t) => !CATEGORY_TAGS.includes(t as never)));
console.log(`\n카테고리 없음: ${none.length}건`);

const want = process.argv[2];
if (want) {
  const list = upcoming.filter((f) => classifyTags(f.title, f.overview, f.startDate).includes(want as never));
  console.log(`\n--- "${want}" ${list.length}건 ---`);
  list.slice(0, 40).forEach((f) => console.log("  ", f.title.slice(0, 44)));
}

if (process.argv[2] === "없음") {
  console.log(`\n--- 카테고리 없는 축제 ${none.length}건 ---`);
  none.slice(0, 45).forEach((f) => console.log("  ", f.title.slice(0, 44)));
}
