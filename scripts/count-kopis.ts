/**
 * KOPIS 공연 건수 측정 (개발 보조)
 *
 *   npx tsx scripts/count-kopis.ts
 *
 * 목록 API 가 총건수를 주지 않으므로 100건씩 끝까지 넘겨 가며 센다.
 * 장르별 규모를 알아야 페이지 구조(정적 생성 가능 여부)를 정할 수 있다.
 */
import { loadEnv } from "./tour-api";

const BASE = "http://www.kopis.or.kr/openApi/restful/pblprfr";
const ROWS = 100; // 문서상 최대값

/** 장르코드. 공통코드 문서 기준이며 실제 응답의 genrenm 으로 검증한다 */
const GENRES: Record<string, string> = {
  AAAA: "연극",
  BBBC: "무용(서양/한국)",
  CCCA: "서양음악(클래식)",
  CCCC: "한국음악(국악)",
  CCCD: "대중음악",
  EEEA: "복합",
  EEEB: "서커스/마술",
  GGGA: "뮤지컬",
};

function getKey(): string {
  const key = process.env.KOPIS_API_KEY?.trim();
  if (!key) throw new Error("KOPIS_API_KEY 가 없습니다.");
  return key;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 연속 호출하면 간헐적으로 400 이 떨어져서 간격을 두고 재시도한다 */
async function page(params: Record<string, string | number>): Promise<string[]> {
  const url = new URL(BASE);
  url.searchParams.set("service", getKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url);
    const xml = await res.text();
    if (res.ok) return [...xml.matchAll(/<mt20id>([^<]+)<\/mt20id>/g)].map((m) => m[1]);
    if (attempt === 4) throw new Error(`HTTP ${res.status} — ${xml.slice(0, 120)}`);
    await sleep(800 * attempt);
  }
  return [];
}

/** 해당 조건의 전체 건수 (중복 id 제외) */
async function countAll(params: Record<string, string | number>, cap = 200): Promise<{ count: number; pages: number }> {
  const seen = new Set<string>();
  let p = 1;
  for (; p <= cap; p++) {
    const ids = await page({ ...params, cpage: p, rows: ROWS });
    ids.forEach((id) => seen.add(id));
    if (ids.length < ROWS) break;
    await sleep(150); // 서버 부담을 줄인다
  }
  return { count: seen.size, pages: p };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  loadEnv(process.cwd());
  const today = new Date();
  const stdate = ymd(today);
  const eddate = ymd(new Date(today.getTime() + 365 * 86_400_000));
  console.log(`[info] 기간 ${stdate} ~ ${eddate} (오늘부터 1년)\n`);

  let total = 0;
  for (const [code, name] of Object.entries(GENRES)) {
    const { count, pages } = await countAll({ stdate, eddate, shcate: code });
    total += count;
    console.log(`${name.padEnd(16)} ${String(count).padStart(6)}건  (${pages}페이지)`);
  }
  console.log(`${"─".repeat(34)}\n${"장르 합계".padEnd(16)} ${String(total).padStart(6)}건`);

  const { count: allCount, pages: allPages } = await countAll({ stdate, eddate });
  console.log(`${"전체(장르무관)".padEnd(15)} ${String(allCount).padStart(6)}건  (${allPages}페이지)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
