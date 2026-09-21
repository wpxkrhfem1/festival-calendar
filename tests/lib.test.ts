/**
 * 핵심 로직 단위 테스트 (node:test)
 *   npm test
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dDayLabel,
  formatKoreanDate,
  formatPeriod,
  fromApiDate,
  monthsBetween,
  statusOf,
  targetYearForMonth,
  todayKST,
} from "../lib/date";
import { parseAddress } from "../lib/regions";
import { classifyTags, placeholderFor } from "../lib/tags";
import { extractUrl, normalizeFestival, stripHtml } from "../lib/normalize";

describe("date", () => {
  it("TourAPI 날짜 → ISO", () => {
    assert.equal(fromApiDate("20260921"), "2026-09-21");
    assert.equal(fromApiDate("20260230"), null); // 존재하지 않는 날짜
    assert.equal(fromApiDate(""), null);
    assert.equal(fromApiDate(undefined), null);
  });

  it("한국어 날짜 형식", () => {
    assert.equal(formatKoreanDate("2026-09-21"), "9월 21일 (월)");
    assert.equal(formatKoreanDate("2026-09-20"), "9월 20일 (일)");
    assert.equal(formatPeriod("2026-09-20", "2026-09-20"), "9월 20일 (일)");
    assert.equal(formatPeriod("2026-09-20", "2026-10-05"), "9월 20일 (일) ~ 10월 5일 (월)");
    assert.equal(
      formatPeriod("2026-12-20", "2027-01-05"),
      "2026년 12월 20일 (일) ~ 2027년 1월 5일 (화)",
    );
  });

  it("걸쳐 있는 달 계산 (연말→연초 포함)", () => {
    assert.deepEqual(monthsBetween("2026-12-20", "2027-01-05"), ["2026-12", "2027-01"]);
    assert.deepEqual(monthsBetween("2026-10-01", "2026-10-03"), ["2026-10"]);
    assert.deepEqual(monthsBetween("2026-03-30", "2026-05-01"), ["2026-03", "2026-04", "2026-05"]);
    assert.deepEqual(monthsBetween("2026-05-01", "2026-04-01"), ["2026-05"]); // 비정상 데이터
  });

  it("D-day / 상태", () => {
    assert.equal(statusOf("2026-10-01", "2026-10-05", "2026-09-21"), "upcoming");
    assert.equal(statusOf("2026-10-01", "2026-10-05", "2026-10-03"), "ongoing");
    assert.equal(statusOf("2026-10-01", "2026-10-05", "2026-10-06"), "ended");
    assert.equal(dDayLabel("2026-10-01", "2026-10-05", "2026-09-21"), "D-10");
    assert.equal(dDayLabel("2026-10-01", "2026-10-05", "2026-10-01"), "D-Day");
    assert.equal(dDayLabel("2026-10-01", "2026-10-05", "2026-10-03"), "진행 중 · 2일 남음");
    assert.equal(dDayLabel("2026-10-01", "2026-10-05", "2026-10-05"), "오늘 마지막");
    assert.equal(dDayLabel("2026-10-01", "2026-10-05", "2026-10-06"), "종료");
  });

  it("월 페이지의 연도 결정", () => {
    assert.equal(targetYearForMonth(9, "2026-09-21"), 2026);
    assert.equal(targetYearForMonth(12, "2026-09-21"), 2026);
    assert.equal(targetYearForMonth(3, "2026-09-21"), 2027);
  });

  it("KST 오늘", () => {
    // UTC 2026-09-20 20:00 → KST 2026-09-21 05:00
    assert.equal(todayKST(new Date("2026-09-20T20:00:00Z")), "2026-09-21");
    assert.equal(todayKST(new Date("2026-09-20T10:00:00Z")), "2026-09-20");
  });
});

describe("regions", () => {
  it("주소에서 시도/시군구 추출", () => {
    assert.deepEqual(parseAddress("강원특별자치도 강릉시 경포로 365"), { sido: "강원", sigungu: "강릉시" });
    assert.deepEqual(parseAddress("서울특별시 종로구 세종대로 175"), { sido: "서울", sigungu: "종로구" });
    assert.deepEqual(parseAddress("전북특별자치도 전주시 완산구"), { sido: "전북", sigungu: "전주시" });
    assert.deepEqual(parseAddress("전라북도 김제시"), { sido: "전북", sigungu: "김제시" });
  });
  it("주소가 없으면 areaCode 로 보완", () => {
    assert.deepEqual(parseAddress("", "39"), { sido: "제주", sigungu: "" });
    assert.deepEqual(parseAddress(undefined, "6"), { sido: "부산", sigungu: "" });
  });
});

describe("tags", () => {
  it("키워드로 카테고리 태그 부여 + 계절", () => {
    assert.deepEqual(classifyTags("홍성 남당항 대하축제", "", "2026-09-10").sort(), ["가을", "먹거리"].sort());
    assert.ok(classifyTags("부산불꽃축제", "", "2026-11-01").includes("불꽃/야경"));
    assert.ok(classifyTags("진해군항제", "벚꽃이 만개하는 봄", "2026-03-25").includes("꽃/자연"));
    assert.ok(classifyTags("안동국제탈춤페스티벌", "", "2026-09-26").includes("문화/전통"));
    assert.ok(classifyTags("서울재즈페스티벌", "", "2026-05-30").includes("음악/공연"));
  });
  it("'페스티벌'만으로는 음악/공연을 주지 않는다", () => {
    const tags = classifyTags("보령머드페스티벌", "", "2026-07-20");
    assert.ok(!tags.includes("음악/공연"));
    assert.ok(tags.includes("여름"));
  });
  it("여러 태그 동시 부여", () => {
    const tags = classifyTags("서울빛초롱축제", "전통 등불과 빛 조형물", "2026-12-15");
    assert.ok(tags.includes("불꽃/야경"));
    assert.ok(tags.includes("문화/전통"));
    assert.ok(tags.includes("겨울"));
  });
  it("플레이스홀더 선택", () => {
    assert.equal(placeholderFor(["먹거리", "가을"]), "/placeholder/food.svg");
    assert.equal(placeholderFor(["봄"]), "/placeholder/default.svg");
  });
});

describe("normalize", () => {
  it("HTML 제거와 URL 추출", () => {
    assert.equal(stripHtml("안녕<br>하세요 &amp; 반가워요"), "안녕\n하세요 & 반가워요");
    assert.equal(
      extractUrl('<a href="http://www.example.com/fest" target="_blank" title="새창">http://www.example.com</a>'),
      "http://www.example.com/fest",
    );
    assert.equal(extractUrl("www.example.com"), "https://www.example.com");
    assert.equal(extractUrl(""), "");
  });

  it("목록 + 상세 → Festival", () => {
    const f = normalizeFestival(
      {
        contentid: "123",
        contenttypeid: "15",
        title: "홍성 남당항 대하축제",
        eventstartdate: "20260910",
        eventenddate: "20261010",
        addr1: "충청남도 홍성군 서부면 남당항로",
        areacode: "34",
        firstimage: "http://tong.visitkorea.or.kr/a.jpg",
        firstimage2: "http://tong.visitkorea.or.kr/a_thumb.jpg",
        tel: "041-000-0000",
        mapx: "126.4",
        mapy: "36.5",
        modifiedtime: "20260901120000",
      },
      { contentid: "123", overview: "가을 <b>대하</b>를 맛보는 축제", homepage: '<a href="https://hongseong.go.kr">홈</a>' },
      { contentid: "123", eventplace: "남당항 일원", usetimefestival: "무료" },
    );
    assert.ok(f);
    assert.equal(f.id, "123");
    assert.equal(f.sido, "충남");
    assert.equal(f.sigungu, "홍성군");
    assert.deepEqual(f.months, ["2026-09", "2026-10"]);
    assert.equal(f.homepage, "https://hongseong.go.kr");
    assert.equal(f.overview, "가을 대하를 맛보는 축제");
    assert.equal(f.place, "남당항 일원");
    assert.equal(f.fee, "무료");
    assert.equal(f.lng, 126.4);
    assert.ok(f.tags.includes("먹거리"));
  });

  it("날짜가 없으면 null", () => {
    assert.equal(
      normalizeFestival({ contentid: "1", contenttypeid: "15", title: "x", eventstartdate: "", eventenddate: "" }),
      null,
    );
  });
});
