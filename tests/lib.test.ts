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
  customRange,
  isIsoDate,
  monthsFromCurrent,
  overlaps,
  statusOf,
  whenLabel,
  targetYearForMonth,
  todayKST,
} from "../lib/date";
import { parseAddress } from "../lib/regions";
import { classifyTags, placeholderFor } from "../lib/tags";
import { extractUrl, normalizeFestival, stripHtml } from "../lib/normalize";
import { buildIcs, icsFileName } from "../lib/ics";
import { dialNumber, displayTel, searchUrl } from "../lib/contact";
import type { Tag } from "../lib/types";

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

describe("캘린더 파일(.ics)", () => {
  const festival = {
    id: "123",
    title: "홍성 남당항 대하축제",
    startDate: "2026-09-10",
    endDate: "2026-10-10",
    sido: "충남",
    sigungu: "홍성군",
    address: "충청남도 홍성군 서부면 남당항로",
    overview: "가을; 대하, 축제\n둘째 줄",
    homepage: "https://hongseong.go.kr",
    image: "",
    thumbnail: "",
    tel: "",
    tags: [] as Tag[],
    months: [] as string[],
  };

  const ics = buildIcs([festival], [], new Date("2026-09-22T00:00:00Z"));

  it("종일 일정의 DTEND 는 끝난 다음 날이다", () => {
    // 그대로 넣으면 캘린더에서 마지막 날이 빠진다
    assert.ok(ics.includes("DTSTART;VALUE=DATE:20260910"));
    assert.ok(ics.includes("DTEND;VALUE=DATE:20261011"));
  });

  it("특수문자를 이스케이프한다", () => {
    // 긴 줄은 75옥텟마다 접혀 있으므로 펼친 뒤에 확인한다
    const unfolded = ics.split("\r\n ").join("");
    assert.ok(unfolded.includes("DESCRIPTION:가을\\; 대하\\, 축제\\n둘째 줄"));
  });

  it("어떤 줄도 75옥텟을 넘지 않는다", () => {
    // 한글은 글자당 3바이트라 제목만으로도 금방 넘는다
    const enc = new TextEncoder();
    const over = ics.split("\r\n").filter((line) => enc.encode(line).length > 75);
    assert.deepEqual(over, []);
  });

  it("하루 전 알림이 들어간다", () => {
    assert.ok(ics.includes("BEGIN:VALARM"));
    assert.ok(ics.includes("TRIGGER:-P1D"));
  });

  it("빈 목록이어도 올바른 VCALENDAR 를 만든다", () => {
    const empty = buildIcs([], []);
    assert.ok(empty.startsWith("BEGIN:VCALENDAR"));
    assert.ok(empty.trimEnd().endsWith("END:VCALENDAR"));
  });

  it("파일명에서 경로 문자를 제거한다", () => {
    assert.equal(icsFileName("서울/빛초롱: 등축제"), "서울빛초롱 등축제.ics");
    assert.equal(icsFileName(""), "일정.ics");
  });
});

describe("추가된 분류 키워드", () => {
  const cat = (name: string) => classifyTags(name, "", "2026-10-01");

  it("음식 이름이 지명에 섞여 들어가도 엉뚱한 태그를 주지 않는다", () => {
    // 금-산삼-계탕: "산삼" 으로 잡히면 안 되지만 삼계탕이라 먹거리는 맞다
    assert.ok(cat("금산삼계탕축제").includes("먹거리"));
    // 허-심청: 스파 이름이지 심청전이 아니다
    assert.ok(!cat("허심청브로이 옥토버페스트").includes("문화/전통"));
    assert.ok(cat("허심청브로이 옥토버페스트").includes("먹거리"));
  });

  it("이름에 성격이 드러난 축제를 잡는다", () => {
    for (const [name, tag] of [
      ["봉화송이축제", "먹거리"],
      ["군산짬뽕페스티벌", "먹거리"],
      ["목포항구축제", "먹거리"],
      ["부안붉은노을축제", "불꽃/야경"],
      ["양재 플라워 페스타", "꽃/자연"],
      ["2026 제주올레걷기축제", "꽃/자연"],
      ["금정산성축제", "문화/전통"],
      ["강동선사문화축제", "문화/전통"],
      ["부산일러스트레이션페어V.7", "전시/예술"],
      ["2026 서울발레페스티벌", "음악/공연"],
    ] as const) {
      assert.ok(cat(name).includes(tag), `${name} → ${tag}`);
    }
  });
});

describe("날짜 직접 고르기", () => {
  it("YYYY-MM-DD 검사", () => {
    assert.ok(isIsoDate("2026-10-03"));
    assert.ok(!isIsoDate("2026-02-30")); // 없는 날
    assert.ok(!isIsoDate("2026-10-3"));
    assert.ok(!isIsoDate(""));
  });

  it("둘 다 고르면 그 구간", () => {
    assert.deepEqual(customRange("2026-10-03", "2026-10-05"), { from: "2026-10-03", to: "2026-10-05" });
  });

  it("거꾸로 골라도 받아준다", () => {
    assert.deepEqual(customRange("2026-10-05", "2026-10-03"), { from: "2026-10-03", to: "2026-10-05" });
  });

  it("한쪽만 고르면 그날 하루", () => {
    assert.deepEqual(customRange("2026-10-03", ""), { from: "2026-10-03", to: "2026-10-03" });
    assert.deepEqual(customRange("", "2026-10-03"), { from: "2026-10-03", to: "2026-10-03" });
  });

  it("비었거나 형식이 틀리면 제한 없음", () => {
    assert.equal(customRange("", ""), null);
    assert.equal(customRange("어제", "오늘"), null);
  });

  it("고른 구간에 하루라도 걸치면 결과에 든다", () => {
    const range = customRange("2026-10-03", "2026-10-05");
    assert.ok(overlaps("2026-09-28", "2026-10-04", range)); // 앞에서 걸침
    assert.ok(overlaps("2026-10-05", "2026-10-20", range)); // 뒤에서 걸침
    assert.ok(!overlaps("2026-10-06", "2026-10-10", range)); // 하루 차이로 안 걸림
  });

  it("화면에 적을 시기 이름", () => {
    assert.equal(whenLabel("all", null), null);
    assert.equal(whenLabel("ongoing", null), "지금 진행 중");
    assert.equal(whenLabel("custom", customRange("2026-10-03", "2026-10-05")), "10월 3일 (토) ~ 10월 5일 (월)");
    assert.equal(whenLabel("custom", customRange("2026-10-03", "")), "10월 3일 (토)");
    assert.equal(whenLabel("custom", null), null);
  });
});

describe("연락처 정리", () => {
  it("여러 번호가 붙어 있어도 첫 번째 번호만 건다", () => {
    // 실제 데이터에 있던 값들이다. 예전에는 숫자만 남겨서 31자리로 전화를 걸었다
    assert.equal(dialNumber("서울 02-786-0610수원 031-5191-2367화성 070-4202-1017"), "02-786-0610");
    assert.equal(dialNumber("033-808-8007033-808-8009"), "033-808-8007");
    assert.equal(dialNumber("063-454-3912, 3913"), "063-454-3912");
    assert.equal(dialNumber("02-2153-0310, 0311 (12:00~13:00 점심시간)"), "02-2153-0310");
    assert.equal(dialNumber("- 063-236-1577 - 010-4348-3130"), "063-236-1577");
  });

  it("평범한 번호는 그대로", () => {
    assert.equal(dialNumber("041-000-0000"), "041-000-0000");
    assert.equal(dialNumber("1588-1234"), "1588-1234");
    assert.equal(dialNumber("010-1234-5678"), "010-1234-5678");
  });

  it("번호가 없으면 null — 링크를 걸지 않는다", () => {
    assert.equal(dialNumber("행사장 안내 참조"), null);
    assert.equal(dialNumber(""), null);
    assert.equal(dialNumber(undefined), null);
  });

  it("화면 표시는 붙어 있는 번호 사이를 띄운다", () => {
    assert.equal(displayTel("033-808-8007033-808-8009"), "033-808-8007 033-808-8009");
    assert.equal(displayTel("041-000-0000"), "041-000-0000");
  });

  it("홈페이지가 없을 때 쓸 검색 주소", () => {
    const url = searchUrl("횡성한우축제", "횡성군");
    assert.ok(url.startsWith("https://search.naver.com/search.naver?query="));
    assert.ok(url.includes(encodeURIComponent("횡성한우축제 횡성군")));
  });
});
