/**
 * 샘플 데이터 생성 (API 키가 없을 때 빌드/개발용)
 *
 *   npx tsx scripts/make-sample-data.ts
 *
 * 실제 API 를 호출하지 않고, 잘 알려진 국내 축제 이름을 바탕으로 만든 예시 항목을
 * data/festivals.json 에 기록한다. 날짜·이미지 등은 예시값이며 실제 일정이 아니다.
 * 진짜 데이터는 `npm run fetch:festivals` 로 덮어쓴다.
 */
import fs from "node:fs";
import path from "node:path";
import type { Festival, FestivalDataFile } from "../lib/types";
import { monthsBetween } from "../lib/date";
import { classifyTags } from "../lib/tags";
import { parseAddress } from "../lib/regions";

const year = new Date().getFullYear();
const Y = String(year);
const Y1 = String(year + 1);

// [축제명, 시작, 종료, 주소, 개요]
const SAMPLE: [string, string, string, string, string][] = [
  ["화천산천어축제 (예시)", `${Y1}-01-10`, `${Y1}-02-01`, "강원특별자치도 화천군 화천읍 산천어길 137", "꽁꽁 언 화천천 위에서 즐기는 얼음낚시와 눈썰매. 겨울 대표 축제입니다."],
  ["태백산 눈축제 (예시)", `${Y1}-01-16`, `${Y1}-01-25`, "강원특별자치도 태백시 천제단길 168", "대형 눈조각과 눈꽃 트레킹을 즐길 수 있는 겨울 산악 축제."],
  ["대관령 눈꽃축제 (예시)", `${Y1}-02-06`, `${Y1}-02-15`, "강원특별자치도 평창군 대관령면 횡계리", "눈꽃 조각 전시와 전통 썰매 체험."],
  ["광양매화축제 (예시)", `${Y1}-03-13`, `${Y1}-03-22`, "전라남도 광양시 다압면 지막1길 55", "섬진강변 매화마을에 하얀 매화가 만개하는 봄 꽃축제."],
  ["진해군항제 (예시)", `${Y1}-03-27`, `${Y1}-04-05`, "경상남도 창원시 진해구 중원로터리 일원", "벚꽃이 흐드러지는 여좌천과 경화역, 군악의장 페스티벌이 함께 열립니다."],
  ["제주 유채꽃축제 (예시)", `${Y1}-04-03`, `${Y1}-04-12`, "제주특별자치도 서귀포시 표선면 녹산로", "노란 유채꽃과 벚꽃이 함께 피는 녹산로 꽃길 축제."],
  ["담양대나무축제 (예시)", `${Y1}-05-01`, `${Y1}-05-06`, "전라남도 담양군 담양읍 죽녹원로 119", "죽녹원 대나무숲에서 열리는 생태·문화 축제."],
  ["서울재즈페스티벌 (예시)", `${Y1}-05-29`, `${Y1}-05-31`, "서울특별시 송파구 올림픽로 424", "국내외 재즈 뮤지션이 함께하는 도심 음악 페스티벌."],
  ["강릉단오제 (예시)", `${Y1}-06-15`, `${Y1}-06-22`, "강원특별자치도 강릉시 단오장길 1", "유네스코 인류무형문화유산으로 등재된 전통 민속 축제. 관노가면극과 씨름, 그네뛰기가 열립니다."],
  ["보령머드축제 (예시)", `${Y}-07-24`, `${Y}-08-02`, "충청남도 보령시 신흑동 대천해수욕장", "대천해수욕장에서 머드 체험과 해변 공연을 즐기는 여름 축제."],
  ["부산바다축제 (예시)", `${Y}-08-01`, `${Y}-08-06`, "부산광역시 해운대구 해운대해변로 264", "해운대와 광안리 해변에서 열리는 여름 음악 공연과 물놀이 축제."],
  ["홍성 남당항 대하축제 (예시)", `${Y}-09-05`, `${Y}-10-11`, "충청남도 홍성군 서부면 남당항로 213", "가을 제철 대하를 맛볼 수 있는 남당항 먹거리 축제."],
  ["안동국제탈춤페스티벌 (예시)", `${Y}-09-25`, `${Y}-10-04`, "경상북도 안동시 육사로 239", "하회별신굿탈놀이를 비롯한 국내외 탈춤 공연이 열리는 전통 문화 축제."],
  ["진주남강유등축제 (예시)", `${Y}-10-01`, `${Y}-10-12`, "경상남도 진주시 남강로 626", "남강 위에 띄운 수만 개의 유등과 소망등이 밤을 밝히는 빛 축제."],
  ["서울세계불꽃축제 (예시)", `${Y}-10-03`, `${Y}-10-03`, "서울특별시 영등포구 여의동로 330", "한강 여의도 하늘을 수놓는 불꽃 축제."],
  ["부산불꽃축제 (예시)", `${Y}-11-07`, `${Y}-11-07`, "부산광역시 수영구 광안해변로 219", "광안대교를 배경으로 펼쳐지는 대형 불꽃쇼."],
  ["서울빛초롱축제 (예시)", `${Y}-12-12`, `${Y1}-01-11`, "서울특별시 중구 청계천로 1", "청계천과 광화문 일대를 전통 등불과 빛 조형물로 밝히는 겨울 야경 축제."],
  ["대관령 겨울 음악제 (예시)", `${Y}-12-19`, `${Y}-12-27`, "강원특별자치도 평창군 대관령면 솔봉로 325", "설원 속 콘서트홀에서 열리는 클래식 음악 공연."],
];

const festivals: Festival[] = SAMPLE.map(([title, startDate, endDate, address, overview], i) => {
  const { sido, sigungu } = parseAddress(address);
  return {
    id: `sample-${String(i + 1).padStart(3, "0")}`,
    title,
    startDate,
    endDate,
    sido,
    sigungu,
    address,
    image: "",
    thumbnail: "",
    tel: "",
    homepage: "",
    overview,
    tags: classifyTags(title, overview, startDate),
    months: monthsBetween(startDate, endDate),
  };
}).sort((a, b) => a.startDate.localeCompare(b.startDate));

const out: FestivalDataFile = {
  meta: {
    fetchedAt: new Date().toISOString(),
    rangeStart: `${year}-01-01`,
    rangeEnd: `${year + 1}-12-31`,
    count: festivals.length,
    source: "샘플 데이터 (실제 일정 아님) — npm run fetch:festivals 로 교체하세요",
  },
  festivals,
};

const outPath = path.join(process.cwd(), "data", "festivals.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`[done] 샘플 ${festivals.length}건 → ${outPath}`);
