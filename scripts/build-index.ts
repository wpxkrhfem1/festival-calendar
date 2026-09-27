/**
 * 찾기·검색 화면이 브라우저에서 읽을 목록 파일을 만든다.
 *
 *   npx tsx scripts/build-index.ts   →  public/data/index.json
 *
 * 왜 필요한가:
 * /browse, /concert/browse, /search 는 주소창의 조건을 읽어 목록을 거른다.
 * 서버가 있을 때는 서버가 걸러서 HTML 을 만들어 줬지만, 사이트를 완전 정적으로
 * 내보내면서 그 일을 브라우저가 하게 됐다. 그래서 목록을 파일로 구워둔다.
 *
 * JS 번들에 데이터를 박지 않고 따로 두는 이유는, 이 세 화면에 들어온 사람만
 * 받으면 되고 브라우저가 한 번 받아 캐시해 두기 때문이다.
 * 카드에 쓰는 필드 + 검색에 필요한 만큼(주소·출연진)만 담아 약 1MB 이다.
 */
import fs from "node:fs";
import path from "node:path";
import { getAllFestivals } from "../lib/festivals";
import { getAllConcerts } from "../lib/concerts";
import { toConcertCard, toFestivalCard } from "../lib/card";

const OUT_DIR = path.join(process.cwd(), "public", "data");
const OUT = path.join(OUT_DIR, "index.json");

function main() {
  const festivals = getAllFestivals().map((f) => ({
    ...toFestivalCard(f),
    // 검색이 주소도 본다 ("남당항", "종로" 같은 말로 찾는 사람이 있다)
    address: f.address,
  }));
  const concerts = getAllConcerts().map((c) => ({
    ...toConcertCard(c),
    // 출연진 검색이 공연에서는 핵심이다 ("김장훈" 으로 찾는다)
    cast: c.cast ?? "",
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ festivals, concerts }));

  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`[index] 축제 ${festivals.length}건 · 공연 ${concerts.length}건 → public/data/index.json (${kb} KB)`);
}

main();
