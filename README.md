# 전국축제자랑

**배포 주소: https://festival-calendar.vercel.app**

대한민국 전국 축제·페스티벌과 공연을 달별로 모아 보여주는 사이트입니다.
"이번 달에 어디서 뭐 하지?"를 5초 안에 알 수 있게 만드는 것이 목표입니다.

- **기술 스택**: Next.js (App Router, TypeScript), Tailwind CSS v4, Vercel
- **데이터**: 축제는 한국관광공사 TourAPI 4.0 (`KorService2`), 공연은 예술경영지원센터 KOPIS
- **구성**: 상단에서 축제와 공연을 전환합니다. 출처와 성격이 달라 목록을 섞지 않습니다.
- **갱신**: GitHub Actions 가 **매일 새벽 04:00 KST** 데이터를 받아와 커밋 → Vercel 자동 배포
- **규모**: 축제 약 760건, 공연 약 2,800건. 빌드 시 약 3,400 페이지를 정적 생성합니다.

## 페이지

| 경로 | 내용 |
|---|---|
| `/` | 12개월 카드 그리드. 다가오는 달과 지난 달을 나눠 보여줍니다 |
| `/month/[1-12]` | 해당 월 축제 목록. 지역·카테고리·진행 중 필터, 지난 축제는 접어둠 |
| `/festival/[id]` | 상세. 기간(D-day), 지도, 문의, 사진, 캘린더 담기, 같은 지역 공연 추천, JSON-LD Event |
| `/theme/[slug]` | 테마별 모음 (`food` `night` `nature` `culture` `music` `art`) |
| `/region/[slug]` | 지역별 축제·공연 (`seoul`, `busan`, `gyeonggi` … `lib/regions.ts`) |
| `/nearby` | 내 주변 축제. 위치는 브라우저에서만 쓰고 서버로 보내지 않습니다 |
| `/saved` | 찜 목록. localStorage 에만 저장하며 로그인이 없습니다 |
| `/concert` | 공연 홈. 12개월 카드 그리드 |
| `/concert/month/[1-12]` | 해당 월 공연 목록. 장르·지역·공연중 필터 |
| `/concert/[id]` | 공연 상세. 출연진, 가격, 예매처, 같은 지역 축제 추천, JSON-LD Event |
| `/browse?when=&region=&category=&from=&to=` | 시기·지역·카테고리로 축제 찾기 |
| `/concert/browse?when=&region=&genre=` | 시기·지역·장르로 공연 찾기 |
| `/search?q=` | 축제·공연 통합 검색 |
| `/ics?f=id,id&c=id,id` | 캘린더 파일(.ics) 내려받기 |
| `/sitemap.xml`, `/robots.txt` | 자동 생성 |

## 주요 기능

- **찜하기** — 로그인 없이 브라우저에만 저장합니다 (`lib/saved.ts`). 여러 탭이 같은 값을 보도록 `useSyncExternalStore` 로 구독합니다.
- **캘린더에 담기** — 축제 하나 또는 찜 목록 전체를 `.ics` 로 내려받습니다. 하루 전 알림(VALARM)이 들어갑니다.
- **내 주변** — Geolocation + 하버사인 거리. 공연은 KOPIS 가 좌표를 주지 않아 축제만 대상입니다.
- **공유** — Web Share API, 없으면 주소 복사.
- **날짜 직접 고르기** — 시기 필터에서 `날짜 직접 고르기` 를 고르면 구간을 지정할 수 있습니다.
- **축제 ↔ 공연 교차 추천** — 같은 시도 + 기간이 겹치는 것끼리 잇습니다.
- **방문 통계** — Vercel Analytics / Speed Insights.

## 1. API 키 발급

1. [공공데이터포털](https://www.data.go.kr) 회원가입 후 로그인
2. **한국관광공사_국문 관광정보 서비스_GW** 검색 → [활용신청](https://www.data.go.kr/data/15101578/openapi.do)
3. 승인(보통 즉시~수 시간) 후 마이페이지 → 인증키 확인
4. **일반 인증키(Decoding)** 값을 복사합니다. (Encoding 키를 넣으면 `%` 가 이중 인코딩되어 실패합니다)

> 개발 계정은 일일 1,000회 트래픽 제한이 있습니다. 축제 상세는 1건당 3회(개요·소개·사진) 호출이라
> 수집 스크립트가 **신규/변경 건만** 상세를 받고 `--max-detail` 로 상한을 둡니다.
> 나머지는 다음 실행에서 이어서 처리됩니다. 매일 돌리므로 밀린 것은 하루 이틀이면 따라잡습니다.

### KOPIS 키 (공연 데이터)

공연은 별도 데이터원이라 키도 따로 받습니다. 공공데이터포털이 아니라 KOPIS 자체 사이트에서 받는 편이 간단합니다.

1. [KOPIS 인증키 발급신청](https://kopis.or.kr/por/cs/openapi/openApiUseSend.do?menuId=MNU_00074) 접속
2. 이름·이메일, 서비스목적(웹/모바일 서비스 개발), 신청자 구분, 소재지 입력 후 제출
3. 발급된 키를 `.env.local` 의 `KOPIS_API_KEY` 에 넣습니다

KOPIS API 는 관광공사 API 와 네 가지가 다릅니다.

- 엔드포인트가 `http://www.kopis.or.kr/openApi/restful/pblprfr` 이고, 키 파라미터 이름이 `serviceKey` 가 아니라 `service` 입니다.
- 응답이 JSON 이 아니라 **XML** 입니다 (`fast-xml-parser` 로 파싱).
- 한 번에 **최대 100건**만 조회됩니다 (관광공사는 500건).
- 빠르게 연속 호출하면 `Request Blocked` 400 이 납니다. `scripts/kopis-api.ts` 가 320ms 간격으로 직렬화하고, 막히면 5→15→40→90초로 물러섭니다.

## 2. 로컬 실행

```bash
npm install
cp .env.example .env.local   # TOUR_API_KEY, KOPIS_API_KEY, NEXT_PUBLIC_SITE_URL 채우기
npm run probe:api            # (선택) API 응답 구조를 눈으로 확인
npm run fetch:festivals      # data/festivals.json 생성 (축제)
npm run fetch:concerts       # data/concerts.json 생성 (공연)
npm test                     # 단위 테스트
npm run dev                  # http://localhost:3000
```

API 키가 아직 없다면 샘플 데이터로 화면을 확인할 수 있습니다. (실제 일정이 아니며 `meta.source` 에 표시됩니다)

```bash
npx tsx scripts/make-sample-data.ts
```

### 수집 스크립트 옵션

```bash
npm run fetch:festivals -- --dry-run          # 저장하지 않고 앞 2건만 출력
npm run fetch:festivals -- --no-detail        # 목록만 (상세 호출 없음)
npm run fetch:festivals -- --max-detail=200   # 상세 호출 상한 (워크플로 기본값)
npx tsx scripts/reapply-rules.ts              # API 호출 없이 지역·태그 규칙만 다시 적용
npm run add:photos -- --limit=250             # 축제 사진(detailImage2)만 따로 채우기
npx tsx scripts/check-tags.ts 먹거리          # 태그 분류 결과 확인 (인자 없으면 전체 집계)

npm run probe:kopis                           # KOPIS 응답 구조 확인
npm run count:kopis                           # KOPIS 장르별 건수 측정
npm run fetch:concerts -- --max-detail=600    # 공연 상세 호출 상한 (워크플로 기본값)
```

### 일일 트래픽 한도와 운영계정 전환

개발계정은 하루 1,000회입니다. 축제 상세가 1건당 3회이므로 `--max-detail=200` 이면 약 600회 + 목록 10회 정도로
한도 안에 들어옵니다. 한도를 늘리려면:

1. 공공데이터포털 → 마이페이지 → 활용신청 현황 → 해당 API → **운영계정 신청**
2. 서비스 URL(배포 주소)과 활용 목적을 적어 제출. 한국관광공사 담당자 승인 후 한도가 크게 늘어납니다 (보통 수만 회/일).
3. 키는 그대로 쓰고 별도 변경 없이 적용됩니다.

### 데이터에서 확인된 특이사항

- 실제 응답에서 `areacode` 는 비어 있고 `lDongRegnCd`(법정동 시도 코드)만 옵니다. 지역은 주소 첫 단어로 판별하고, 없으면 이 코드로 보완합니다.
- 2026년 응답에 `전남광주통합특별시` 주소가 등장합니다. 시군구가 구(區)면 광주, 아니면 전남으로 분류합니다 (`lib/regions.ts`).
- 120일 이상 이어지는 상설 공연·전시는 목록 뒤로 보내고 "상설"로 표시합니다.
- `detailInfo2`(행사소개·행사내용)는 `detailCommon2`의 개요, `detailIntro2`의 프로그램과 **내용이 같습니다**. 18건 대조로 확인했으니 다시 붙이지 마세요.
- 축제 사진은 `detailImage2`에서 옵니다. 764건 중 590건(77%)이 보유하며 평균 6.4장입니다. 나머지는 API 에 사진 자체가 없습니다 (재조회해도 0장).
- 좌표는 축제 764건 전부 있습니다. **공연은 좌표가 하나도 없습니다** — 그래서 "근처"를 거리가 아니라 같은 시도로 판단합니다.
- 내년 달은 아직 등록이 적어(5개 미만) 올해 같은 달 축제를 참고용으로 함께 보여줍니다. 매년 열리는 축제가 많아 실제로 유용합니다.
- 전화번호가 `"서울 02-786-0610수원 031-5191-2367화성 070-4202-1017"` 처럼 여러 개 붙어 오는 경우가 있습니다.
  `lib/contact.ts` 가 전화번호처럼 생긴 첫 덩어리만 뽑습니다 (15xx~18xx 대표번호는 4+4자리로 따로 처리).
- 수집 범위: **올해 1/1 ~ 내년 12/31**
- 한 축제가 여러 달에 걸치면(예: 12/20~1/5) `months: ["2026-12","2027-01"]` 로 저장되어 양쪽 달에 모두 노출됩니다.
- 목록 수집이 실패하면 **기존 festivals.json 을 그대로 두고** 종료 코드 1 로 끝납니다. 사이트가 빈 상태로 배포되는 일은 없습니다.
- 상세 호출이 개별로 실패하면 이전에 저장한 개요·홈페이지를 재사용합니다.

## 3. 배포 (Vercel)

1. GitHub 에 push 후 Vercel 에서 **Import Project**
2. 환경변수 설정
   - `NEXT_PUBLIC_SITE_URL` = 배포 도메인 (예: `https://festival-calendar.vercel.app`) — OG/sitemap 절대경로에 사용
   - `TOUR_API_KEY` 는 **빌드에 필요 없습니다.** 데이터는 저장소의 JSON 을 읽습니다. (넣어도 클라이언트에 노출되지 않음)
3. 배포. 페이지는 빌드 시 정적 생성(SSG)되고 하루 1회 재검증(ISR)됩니다.

### 자동 갱신 (GitHub Actions)

`.github/workflows/update-festivals.yml` 이 **매일 04:00 KST** 에 실행됩니다.

1. GitHub 저장소 → Settings → Secrets and variables → Actions → **New repository secret**
2. `TOUR_API_KEY` (관광공사 디코딩 키) 와 `KOPIS_API_KEY` (KOPIS 키) 두 개를 등록
3. Actions 탭에서 **축제·공연 데이터 갱신** 워크플로를 `Run workflow` 로 한 번 수동 실행해 확인

변경이 있으면 `데이터: 자동 갱신 (축제 N건, 공연 M건)` 커밋이 올라가고 Vercel 이 다시 배포합니다.

## 4. overrides.json 편집법

API 에 없는 축제를 추가하거나 잘못된 정보를 고칠 때 `data/overrides.json` 을 편집합니다.
수집 스크립트가 festivals.json 을 덮어써도 overrides 는 유지되며, 빌드 시 병합됩니다.

```json
{
  "festivals": [
    { "id": "2673464", "endDate": "2026-10-12", "homepage": "https://example.go.kr/festival" },

    { "id": "574285", "extraTags": ["문화/전통"], "_메모": "김제지평선축제 — 전통농경문화 주제" },

    {
      "id": "manual-hongdae-busking",
      "title": "홍대 거리 버스킹 위크",
      "startDate": "2026-10-10",
      "endDate": "2026-10-12",
      "sido": "서울",
      "sigungu": "마포구",
      "address": "서울특별시 마포구 홍익로 일대",
      "overview": "홍대 걷고싶은거리에서 열리는 버스킹 축제",
      "tags": ["음악/공연", "가을"]
    },

    { "id": "1234567", "hidden": true }
  ]
}
```

규칙:

- `id` 는 필수. festivals.json 에 같은 id 가 있으면 **적은 필드만** 덮어씁니다.
- 없는 id 면 새 축제로 추가됩니다. 이때 `title`, `startDate` 는 필수, `endDate` 생략 시 시작일과 같게 처리.
- `hidden: true` 면 목록에서 숨깁니다 (취소된 축제 등).
- 날짜는 `YYYY-MM-DD`. 날짜를 바꾸면 걸치는 달과 계절 태그가 자동 재계산됩니다.
- **`tags`** 를 직접 주면 자동 분류를 통째로 갈아치웁니다. 계절 태그까지 직접 적어야 합니다.
- **`extraTags`** 는 자동 분류 결과에 더하기만 합니다. 축제명만으로는 성격을 알 수 없는 경우(김제지평선축제, 페인터즈 등)에 이쪽을 쓰세요. 현재 29건이 이 방식으로 지정돼 있습니다.
- `_` 로 시작하는 키(`_메모` 등)는 파일에 남기는 주석이며 데이터에 섞이지 않습니다.
- 사용 가능한 태그: `먹거리`, `불꽃/야경`, `꽃/자연`, `문화/전통`, `음악/공연`, `전시/예술`, `봄`, `여름`, `가을`, `겨울`
- 이미지는 `tong.visitkorea.or.kr`, `kopis.or.kr` 도메인만 next/image 최적화를 거칩니다.

## 프로젝트 구조

```
app/
  page.tsx                홈 (12개월 그리드)
  month/[month]/          월별 축제 + OG 이미지
  festival/[id]/          축제 상세 + OG 이미지
  theme/[slug]/           테마별 모음 + OG 이미지
  region/[sido]/          지역별 축제·공연 + OG 이미지
  concert/                공연 홈 · 월별 · 상세 · 찾기
  browse/ search/         조건으로 찾기 · 통합 검색
  nearby/ saved/          내 주변 · 찜 목록
  ics/route.ts            캘린더 파일(.ics) 내려주기
  sitemap.ts, robots.ts
components/               UI (FestivalList / ConcertList 는 클라이언트 필터)
lib/
  types.ts                Festival / Concert / API 응답 타입
  card.ts                 목록 화면에 넘길 최소 필드 (FestivalCardData 등)
  date.ts                 KST 오늘, D-day, 날짜 형식, 걸치는 달, 목록 정렬 기준
  regions.ts              시도 매핑 · 주소 파싱
  tags.ts                 키워드 기반 카테고리 태그 · 테마 정의
  search.ts               검색어 해석 (꼬리말 분리)
  contact.ts              전화번호 정리 · 검색 링크
  geo.ts                  거리 계산
  ics.ts                  캘린더 파일 생성
  saved.ts                찜 저장소 (localStorage)
  normalize.ts            TourAPI 응답 → Festival
  normalize-concert.ts    KOPIS 응답 → Concert
  festivals.ts            festivals.json + overrides.json 병합, 조회
  concerts.ts             concerts.json 조회
  og.tsx                  OG 이미지 공용 (한글 폰트 로드)
scripts/
  fetch-festivals.ts      축제 수집        tour-api.ts    TourAPI 호출
  fetch-concerts.ts       공연 수집        kopis-api.ts   KOPIS 호출 (throttle)
  check-tags.ts           태그 분류 확인    add-photos.ts  사진만 보강
  probe-api.ts / probe-kopis.ts / count-kopis.ts / reapply-rules.ts
data/
  festivals.json          축제 수집 결과 (자동 생성)
  concerts.json           공연 수집 결과 (자동 생성)
  overrides.json          수동 보정
tests/                    node:test 단위 테스트
```

## 출처

데이터 제공: **한국관광공사** (TourAPI 4.0), **예술경영지원센터** (KOPIS 공연예술통합전산망).
축제 일정·요금은 주최 측 사정으로 변경될 수 있습니다.

## 운영 메모 (실제 배포에서 확인한 것)

여기 적힌 것은 전부 배포본을 눌러보다가 발견해서 고친 것입니다. 같은 실수를 반복하지 않으려고 남깁니다.

### 빌드·수집

- **GitHub Actions 에서는 `npm ci` 가 아니라 `npm install` 을 쓴다.** Windows 에서 만든 `package-lock.json` 에
  리눅스 러너용 선택적 의존성(`@emnapi/*`)이 빠져 있어 `npm ci` 가 `Missing ... from lock file` 로 실패한다.
- **해외 러너에서 `apis.data.go.kr` 접속이 느리다.** Node 기본 연결 타임아웃 10초로는 `ConnectTimeoutError` 가 난다.
  `scripts/tour-api.ts` 가 undici Agent 로 연결 60초·헤더/본문 120초를 잡고 5회까지 재시도한다.

### 태그 분류

- **태그는 축제명에서만 찾는다.** 개요 본문까지 보면 거의 모든 소개글에 "먹거리", "공연" 이 들어가
  경복궁 별빛야행이 먹거리로 잡히는 오분류가 쏟아진다. `npx tsx scripts/check-tags.ts [태그명]` 으로 확인한다.
- **"문화" 한 단어는 쓰지 않는다.** 지역축제 대부분이 "○○문화제" 라 165건이 전부 걸렸다.
- **부분 문자열 사고를 조심한다.** 허-심청(스파 이름), 금-산삼-계탕처럼 다른 단어 안에 키워드가 들어간다. `EXCLUDE` 규칙으로 막는다.
- **★ 태그는 읽을 때 다시 계산한다** (`lib/festivals.ts` 의 `retag`). `festivals.json` 에 수집 당시 태그가 박혀 있어서
  규칙을 고쳐도 데이터를 다시 받기 전까지 화면이 그대로였다. 실제로 규칙을 두 번 고치고도 반영이 안 된 채였다.
- 축제명만으로 성격을 알 수 없는 것은 개요를 읽고 `overrides.json` 의 `extraTags` 로 지정한다. 지금 미분류는 약 19%이고,
  월·지역·검색으로는 모두 찾히므로 무리해서 0으로 만들지 않는다.

### 색인 (SEO)

- **끝난 축제는 색인하지 않는다.** 전체의 약 3분의 2가 지난 축제다. 사이트맵에서 빼고 `noindex` 를 붙이되
  상세 페이지는 링크가 깨지지 않게 남기고 "지금 갈 수 있는 축제" 를 함께 보여준다.
- **지난 달 페이지도 `noindex`.** 다음 해 일정이 쌓이면 기본 연도가 넘어가면서 자동으로 되살아난다.
- **건수가 너무 적은 달도 `noindex`.** KOPIS 가 1년치만 줘서 먼 달은 공연이 1~4건뿐이다.
- **★ 상세 페이지에 `dynamicParams = false` 를 빼먹으면 soft 404 가 난다.** `/festival/9999999` 가
  "페이지를 찾을 수 없어요" 화면을 보여주면서 HTTP 200 을 돌려줬다. 검색엔진은 그걸 정상 페이지로 본다.
- `/browse`, `/search`, `/saved` 는 조합이 많거나 사람마다 달라 `noindex`. 그래서 검색 유입은 월·지역·테마 페이지가 받는다.

### 목록 화면

- **끝난 것을 목록 맨 뒤로 보낸다** (`lib/date.ts` 의 `compareForList`). 이 규칙을 빠뜨려서
  월 페이지 → 지역 페이지 → 검색 순으로 **같은 문제를 세 번 고쳤다.** 새 목록 화면을 만들면 이걸 쓴다.
- **목록에는 `lib/card.ts` 의 최소 필드만 넘긴다.** `Festival`/`Concert` 를 통째로 넘기면
  `overview`·`program`·`photos`·`introImages` 가 따라와 찜 페이지 하나가 1.3MB 였다 (지금은 369KB).

### 검색

- **한국어는 붙여 쓴다.** "가을축제" 가 0건, "가을 축제" 가 128건이었다.
  원래 검색어로 먼저 찾고 **0건일 때만** 꼬리말("축제/페스티벌/콘서트"…)을 떼어 다시 찾는다 (`lib/search.ts`).
  순서를 지켜야 정확히 친 사람의 결과가 흐려지지 않는다.

### 이미지

- 카드 이미지는 `firstimage`(원본, 세로 600px대)를 쓴다. `firstimage2`(썸네일)는 300×200 고정이라 흐리다.
- 고유 이미지 URL 이 7,000개에 가깝고 Vercel Hobby 의 이미지 최적화 한도는 월 5,000회다.
  `next.config.ts` 에서 너비 후보를 실제 쓰는 `sizes` 에 맞게 줄이고 품질을 하나로 고정했다.
  사진 갤러리 썸네일은 `vw` 대신 고정 폭(`256px`)으로 묶어 변환본이 여러 벌 생기지 않게 한다.

### 화면 문구

- **수를 적을 때는 "지금 갈 수 있는 수" 를 적는다.** 홈이 "전국 축제 764개" 라고 해놓고
  9월 카드가 "187개" 인데 눌러 들어가면 74개가 보였다. 전체 수는 지난 달 카드에서만 쓴다.
