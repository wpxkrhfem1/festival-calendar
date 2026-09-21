/**
 * 공연(KOPIS) 정규화 단위 테스트
 *   npm test
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromKopisDate, normalizeConcert, shortSido } from "../lib/normalize-concert";

describe("concert 날짜/지역", () => {
  it("KOPIS 날짜(점 구분) → ISO", () => {
    assert.equal(fromKopisDate("2026.10.24"), "2026-10-24");
    assert.equal(fromKopisDate("2026.1.5"), "2026-01-05");
    assert.equal(fromKopisDate("2026.02.30"), null); // 없는 날짜
    assert.equal(fromKopisDate(""), null);
    assert.equal(fromKopisDate(undefined), null);
  });

  it("KOPIS 지역명 → 짧은 시도명", () => {
    assert.equal(shortSido("서울특별시"), "서울");
    assert.equal(shortSido("경상남도"), "경남");
    assert.equal(shortSido("강원특별자치도"), "강원");
    assert.equal(shortSido(""), "");
  });
});

describe("normalizeConcert", () => {
  const listItem = {
    mt20id: "PF301330",
    prfnm: "김솔아 콰르텟: Falling in Jazz",
    prfpdfrom: "2026.10.24",
    prfpdto: "2026.10.24",
    fcltynm: "오류아트홀",
    poster: "http://www.kopis.or.kr/upload/pfmPoster/a.gif",
    area: "서울특별시",
    genrenm: "대중음악",
    openrun: "N",
    prfstate: "공연예정",
  };

  it("목록만으로 변환", () => {
    const c = normalizeConcert(listItem);
    assert.ok(c);
    assert.equal(c.id, "PF301330");
    assert.equal(c.sido, "서울");
    assert.equal(c.genre, "대중음악");
    assert.equal(c.openRun, false);
    assert.deepEqual(c.months, ["2026-10"]);
    assert.equal(c.cast, undefined); // 상세를 안 줬으므로 없음
  });

  it("상세를 합치면 출연진·가격·예매처가 채워진다", () => {
    const c = normalizeConcert(listItem, {
      ...listItem,
      fcltynm: "오류아트홀 (대공연장)",
      prfcast: "김솔아, 이진아",
      prfruntime: "1시간 30분",
      pcseguidance: "전석 30,000원",
      prfage: "만 7세 이상",
      updatedate: "2026-09-18 15:13:31",
      relates: { relate: { relatenm: "예스24", relateurl: "https://ticket.yes24.com/Perf/1" } },
      styurls: { styurl: "http://www.kopis.or.kr/upload/pfmIntroImage/a.jpg" },
    });
    assert.ok(c);
    assert.equal(c.venue, "오류아트홀 (대공연장)"); // 상세가 더 정확
    assert.equal(c.cast, "김솔아, 이진아");
    assert.equal(c.price, "전석 30,000원");
    assert.deepEqual(c.tickets, [{ name: "예스24", url: "https://ticket.yes24.com/Perf/1" }]);
    assert.equal(c.introImages?.length, 1);
    assert.equal(c.updatedAt, "2026-09-18 15:13:31");
  });

  it("빈 값에 공백만 들어오면 필드를 만들지 않는다", () => {
    const c = normalizeConcert(listItem, { ...listItem, prfcast: " ", pcseguidance: " " });
    assert.ok(c);
    assert.equal(c.cast, undefined);
    assert.equal(c.price, undefined);
  });

  it("monthsFrom 을 주면 그 이후 달만 계산한다 (오픈런 대비)", () => {
    const c = normalizeConcert(
      { ...listItem, prfpdfrom: "2018.01.01", prfpdto: "2026.11.30", openrun: "Y" },
      null,
      "2026-09-21",
    );
    assert.ok(c);
    assert.deepEqual(c.months, ["2026-09", "2026-10", "2026-11"]);
    assert.equal(c.openRun, true);
  });

  it("날짜가 없으면 null", () => {
    assert.equal(normalizeConcert({ ...listItem, prfpdfrom: "", prfpdto: "" }), null);
  });
});

describe("오픈런 달 범위 자르기", () => {
  const base = {
    mt20id: "PF1",
    prfnm: "오픈런 공연",
    prfpdfrom: "2018.01.01",
    prfpdto: "2031.12.31",
    fcltynm: "대학로 소극장",
    area: "서울특별시",
    genrenm: "연극",
    openrun: "Y",
    prfstate: "공연중",
  };

  it("수집 범위 밖의 달은 만들지 않는다", () => {
    const c = normalizeConcert(base, null, "2026-09-21", "2027-09-21");
    assert.ok(c);
    assert.equal(c.months[0], "2026-09");
    assert.equal(c.months.at(-1), "2027-09");
    assert.equal(c.months.length, 13);
  });

  it("범위를 안 주면 원본 기간 그대로", () => {
    const c = normalizeConcert(base);
    assert.ok(c);
    assert.equal(c.months[0], "2018-01");
    assert.ok(c.months.length > 13);
  });
});
