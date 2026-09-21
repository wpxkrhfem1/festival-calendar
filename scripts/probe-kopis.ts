/**
 * KOPIS(공연예술통합전산망) 응답 구조 확인용 스크립트 (개발 보조)
 *
 *   npx tsx scripts/probe-kopis.ts
 *
 * 공연목록과 공연상세의 원본 XML 을 그대로 출력한다.
 * 필드명을 눈으로 확인한 뒤 타입과 정규화 로직을 맞춘다.
 *
 * 키는 .env.local 의 KOPIS_API_KEY (공공데이터포털에서 별도 발급, 디코딩 키).
 * 주의: KOPIS 는 공공데이터포털 도메인이 아니라 자체 엔드포인트를 쓰고,
 *       파라미터 이름도 serviceKey 가 아니라 service 다.
 */
import { loadEnv } from "./tour-api";

const BASE = "http://www.kopis.or.kr/openApi/restful/pblprfr";

function getKey(): string {
  const key = process.env.KOPIS_API_KEY?.trim();
  if (!key) throw new Error("KOPIS_API_KEY 가 없습니다. .env.local 에 넣어주세요 (README 참고).");
  return key;
}

async function call(path: string, params: Record<string, string | number>): Promise<string> {
  const url = new URL(path);
  url.searchParams.set("service", getKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Accept: "application/xml" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  loadEnv(process.cwd());
  const today = new Date();
  const later = new Date(today.getTime() + 60 * 86_400_000);

  console.log("=== 공연목록 pblprfr (대중음악 장르, 3건) ===");
  const list = await call(BASE, {
    stdate: ymd(today),
    eddate: ymd(later),
    cpage: 1,
    rows: 3,
    shcate: "CCCD", // 대중음악. 코드가 다르면 아래 전체 조회 결과로 확인한다
  });
  console.log(list.slice(0, 3000));

  console.log("\n=== 공연목록 (장르 필터 없이 3건) ===");
  const all = await call(BASE, { stdate: ymd(today), eddate: ymd(later), cpage: 1, rows: 3 });
  console.log(all.slice(0, 3000));

  // 첫 공연 id 로 상세 조회
  const id = all.match(/<mt20id>([^<]+)<\/mt20id>/)?.[1];
  if (id) {
    console.log(`\n=== 공연상세 pblprfr/${id} ===`);
    console.log((await call(`${BASE}/${id}`, {})).slice(0, 4000));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
