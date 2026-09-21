/**
 * 이미 저장된 축제에 사진(detailImage2)만 추가로 채운다. (개발/점진 보강용)
 *
 *   npx tsx scripts/add-photos.ts [--limit=N] [--id=CONTENTID]
 *
 * 전체 재수집 없이 사진만 붙이고 싶을 때 쓴다.
 * 축제 1건당 API 1회라 --limit 으로 일일 한도를 지킨다.
 */
import fs from "node:fs";
import path from "node:path";
import type { FestivalDataFile } from "../lib/types";
import { fetchDetailImages, loadEnv } from "./tour-api";

const OUT_PATH = path.join(process.cwd(), "data", "festivals.json");

function parseArgs(argv: string[]): { limit: number; id?: string } {
  let limit = 250;
  let id: string | undefined;
  for (const a of argv) {
    if (a.startsWith("--limit=")) limit = Math.max(0, Number(a.split("=")[1]) || 0);
    else if (a.startsWith("--id=")) id = a.split("=")[1];
  }
  return { limit, id };
}

async function main() {
  loadEnv(process.cwd());
  const { limit, id } = parseArgs(process.argv.slice(2));
  const data = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as FestivalDataFile;

  // 아직 사진을 확인하지 않은 축제만. 시작일이 빠른 순으로 채운다
  const targets = (id ? data.festivals.filter((f) => f.id === id) : data.festivals.filter((f) => f.photos === undefined))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, id ? 1 : limit);

  console.log(`[info] 사진 조회 대상 ${targets.length}건`);
  let withPhotos = 0;
  let total = 0;
  let failed = 0;

  for (const [i, f] of targets.entries()) {
    try {
      const urls = await fetchDetailImages(f.id);
      // 대표 이미지와 겹치는 사진은 갤러리에서 뺀다
      const gallery = urls.filter((u) => u !== f.image && u !== f.thumbnail);
      // 빈 배열로라도 채워야 다음 실행에서 다시 조회하지 않는다
      f.photos = gallery;
      if (gallery.length) {
        withPhotos += 1;
        total += gallery.length;
      }
    } catch (err) {
      failed += 1;
      console.warn(`[warn] ${f.id} 사진 실패:`, err instanceof Error ? err.message : err);
    }
    if ((i + 1) % 50 === 0) console.log(`[progress] ${i + 1}/${targets.length}`);
  }

  data.meta.fetchedAt = new Date().toISOString();
  const tmp = `${OUT_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, OUT_PATH);

  const remaining = data.festivals.filter((f) => f.photos === undefined).length;
  console.log(`[done] 사진 보유 ${withPhotos}건 / 총 ${total}장, 실패 ${failed}건, 남은 대상 ${remaining}건`);
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
