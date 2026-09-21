/**
 * API 응답 구조 확인용 스크립트 (개발 보조)
 *
 *   npx tsx scripts/probe-api.ts
 *
 * searchFestival2 2건 + 첫 항목의 detailCommon2 / detailIntro2 원본 응답을 그대로 출력한다.
 * 필드명이 문서와 다르면 lib/types.ts 를 여기 출력에 맞춰 수정하면 된다.
 */
import { fetchDetailCommon, fetchDetailIntro, loadEnv, searchFestivalPage } from "./tour-api";

async function main() {
  loadEnv(process.cwd());
  const year = new Date().getFullYear();
  const list = await searchFestivalPage({
    eventStartDate: `${year}0101`,
    eventEndDate: `${year + 1}1231`,
    pageNo: 1,
    numOfRows: 2,
  });
  console.log("=== searchFestival2 (totalCount:", list.totalCount, ") ===");
  console.log(JSON.stringify(list.items, null, 2));

  const first = list.items[0];
  if (!first) return;
  console.log("\n=== detailCommon2", first.contentid, "===");
  console.log(JSON.stringify(await fetchDetailCommon(String(first.contentid)), null, 2));
  console.log("\n=== detailIntro2", first.contentid, "===");
  console.log(JSON.stringify(await fetchDetailIntro(String(first.contentid)), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
