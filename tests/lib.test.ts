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
  monthsFromCurrent,
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
  it("통합특별시 주소는 시군구로 원래 시도를 판별", () => {
    assert.deepEqual(parseAddress("전남광주통합특별시 남구 고싸움로 2"), { sido: "광주", sigungu: "남구" });
    assert.deepEqual(parseAddress("전남광주통합특별시 여수시 선어시장길 6"), { sido: "전남", sigungu: "여수시" });
  });
  it("주소가 없으면 areaCode 로 보완", () => {
    assert.deepEqual(parseAddress("", "39"), { sido: "제주", sigungu: "" });
    assert.deepEqual(parseAddress(undefined, "6"), { sido: "부산", sigungu: "" });
    assert.deepEqual(parseAddress("", "", "48"), { sido: "경남", sigungu: "" });
    assert.deepEqual(parseAddress("", "", "51"), { sido: "강원", sigungu: "" });
  });
});

describe("tags", () => {
  it("축제명의 키워드로 태그 부여 + 계절", () => {
    assert.deepEqual(classifyTags("홍성 남당항 대하축제", "", "2026-09-10").sort(), ["가을", "먹거리"].sort());
    assert.ok(classifyTags("부산불꽃축제", "", "2026-11-01").includes("불꽃/야경"));
    assert.ok(classifyTags("진해 벚꽃축제", "", "2026-03-25").includes("꽃/자연"));
    assert.ok(classifyTags("안동국제탈춤페스티벌", "", "2026-09-26").includes("문화/전통"));
    assert.ok(classifyTags("서울재즈페스티벌", "", "2026-05-30").includes("음악/공연"));
    assert.ok(classifyTags("제16회 광주비엔날레", "", "2026-09-01").includes("전시/예술"));
  });

  it("개요에 있는 말로는 태그를 주지 않는다", () => {
    // 거의 모든 축제 소개글에 먹거리·공연 이야기가 들어가서 오분류가 쏟아졌다
    const tags = classifyTags("경복궁 별빛야행", "다양한 먹거리와 음식, 공연을 즐길 수 있다", "2026-09-01");
    assert.ok(!tags.includes("먹거리"));
    assert.ok(!tags.includes("음악/공연"));
    assert.ok(tags.includes("불꽃/야경")); // 야행은 제목에 있다
  });

  it("한 글자 키워드로 인한 오분류를 막는다", () => {
    // 제N회 의 회, 밤의 석조전의 밤, 문화배달의 배
    assert.ok(!classifyTags("제24회 동강국제사진제", "", "2026-09-01").includes("먹거리"));
    assert.ok(!classifyTags("달밤에체조 부산 챌린지", "", "2026-09-01").includes("먹거리"));
    assert.ok(!classifyTags("문화가 있는날 문화배달", "", "2026-09-01").includes("먹거리"));
  });

  it("여러 태그 동시 부여", () => {
    const tags = classifyTags("서울빛초롱 전통등축제", "", "2026-12-15");
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

describe("현재 달부터 도는 월 순서", () => {
  it("9월이면 9월부터 8월까지 한 바퀴", () => {
    assert.deepEqual(monthsFromCurrent(9), [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it("1월이면 그대로 1~12월", () => {
    assert.deepEqual(monthsFromCurrent(1), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it("12월이면 12월이 맨 앞", () => {
    assert.deepEqual(monthsFromCurrent(12), [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
  it("항상 12개이고 중복이 없다", () => {
    for (let m = 1; m <= 12; m++) {
      const out = monthsFromCurrent(m);
      assert.equal(out.length, 12);
      assert.equal(new Set(out).size, 12);
      assert.equal(out[0], m);
    }
  });
});

describe("문화/전통 분류 폭", () => {
  it("'문화' 라는 말만으로는 전통 태그를 주지 않는다", () => {
    // 지역축제 대부분이 "○○문화제" 라 이 말만 보면 전부 걸린다
    assert.ok(!classifyTags("포천 한탄강 가든페스타", "유네스코 세계지질공원", "2026-09-01").includes("문화/전통"));
    assert.ok(!classifyTags("서울건축문화제", "", "2026-09-01").includes("문화/전통"));
    assert.ok(!classifyTags("생거진천 문화축제", "", "2026-09-01").includes("문화/전통"));
  });

  it("전통을 가리키는 구체적인 말은 잡는다", () => {
    for (const name of ["안동국제탈춤페스티벌", "경복궁 별빛야행", "정선아리랑제", "숭례문 파수의식", "영동난계국악축제"]) {
      assert.ok(classifyTags(name, "", "2026-09-01").includes("문화/전통"), name);
    }
  });
});
