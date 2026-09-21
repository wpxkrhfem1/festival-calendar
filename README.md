# 전국 축제 달력

**배포 주소: https://festival-calendar.vercel.app**

대한민국 전국 축제·페스티벌을 1월~12월 달별로 모아 보여주는 사이트입니다.
"이번 달에 어디서 뭐 하지?"를 5초 안에 알 수 있게 만드는 것이 목표입니다.

- **기술 스택**: Next.js (App Router, TypeScript), Tailwind CSS v4, Vercel
- **데이터**: 축제는 한국관광공사 TourAPI 4.0 (`KorService2`), 공연은 예술경영지원센터 KOPIS
- **구성**: 상단에서 축제와 공연을 전환합니다. 출처와 성격이 달라 목록을 섞지 않습니다.
- **갱신**: GitHub Actions 가 매주 월요일 새벽 데이터를 받아와 커밋 → Vercel 자동 배포

## 페이지

| 경로 | 내용 |
|---|---|
| `/` | 12개월 카드 그리드. 현재 달 강조 + 자동 스크롤 |
| `/month/[1-12]` | 해당 월 축제 목록. 지역·카테고리·진행 중 필터, 시작일/종료 임박 정렬 |
| `/festival/[id]` | 상세. 기간(D-day), 지도 링크, 문의, 홈페이지, 개요, 같은 시기 추천 4개, JSON-LD Event |
| `/region/[slug]` | 지역별 보기 (월별 탭). slug 는 `seoul`, `busan`, `gyeonggi` 등 (`lib/regions.ts`) |
| `/concert` | 공연 홈. 12개월 카드 그리드 |
| `/concert/month/[1-12]` | 해당 월 공연 목록. 장르·지역·공연중 필터 |
| `/concert/[id]` | 공연 상세. 출연진, 가격, 러닝타임, 예매처 링크, JSON-LD Event |
| `/search?q=` | 축제·공연 통합 검색 (구역별로 나눠 표시) |
| `/sitemap.xml`, `/robots.txt` | 자동 생성 |

## 1. API 키 발급

1. [공공데이터포털](https://www.data.go.kr) 회원가입 후 로그인
2. **한국관광공사_국문 관광정보 서비스_GW** 검색 → [활용신청](https://www.data.go.kr/data/15101578/openapi.do)
3. 승인(보통 즉시~수 시간) 후 마이페이지 → 인증키 확인
4. **일반 인증키(Decoding)** 값을 복사합니다. (Encoding 키를 넣으면 `%` 가 이중 인코딩되어 실패합니다)

> 개발 계정은 일일 1,000회 트래픽 제한이 있습니다. 목록 조회는 페이지당 500건씩 몇 번이면 끝나지만,
> 상세(개요·홈페이지)는 축제 1건당 2회 호출이라 스크립트가 **신규/변경 건만** 상세를 받고
> `--max-detail` (기본 600) 로 상한을 둡니다. 나머지는 다음 실행에서 이어서 처리됩니다.
> 운영 전환 신청을 하면 제한이 크게 늘어납니다.


### KOPIS 키 (공연 데이터)

공연은 별도 데이터원이라 키도 따로 받습니다. 공공데이터포털이 아니라 KOPIS 자체 사이트에서 받는 편이 간단합니다.

1. [KOPIS 인증키 발급신청](https://kopis.or.kr/por/cs/openapi/openApiUseSend.do?menuId=MNU_00074) 접속
2. 이름·이메일, 서비스목적(웹/모바일 서비스 개발), 신청자 구분, 소재지 입력 후 제출
3. 발급된 키를 `.env.local` 의 `KOPIS_API_KEY` 에 넣습니다

KOPIS API 는 관광공사 API 와 세 가지가 다릅니다.

- 엔드포인트가 `http://www.kopis.or.kr/openApi/restful/pblprfr` 이고, 키 파라미터 이름이 `serviceKey` 가 아니라 `service` 입니다.
- 응답이 JSON 이 아니라 **XML** 입니다 (`fast-xml-parser` 로 파싱).
- 한 번에 **최대 100건**만 조회됩니다 (관광공사는 500건).
## 2. 로컬 실행

```bash
npm install
cp .env.example .env.local   # TOUR_API_KEY, NEXT_PUBLIC_SITE_URL 채우기
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
npm run fetch:festivals -- --max-detail=200   # 상세 호출 상한
npx tsx scripts/reapply-rules.ts              # API 호출 없이 지역·태그 규칙만 다시 적용

npm run probe:kopis                           # KOPIS 응답 구조 확인
npm run count:kopis                           # KOPIS 장르별 건수 측정
npm run fetch:concerts -- --max-detail=300    # 공연 상세 호출 상한
```

### 일일 트래픽 한도와 운영계정 전환

개발계정은 하루 1,000회입니다. 축제 1건당 상세 2회이므로 처음 수집할 때는 전체(약 740건)를 하루에 못 받고,
`--max-detail` 만큼만 상세를 채운 뒤 나머지는 다음 실행에서 이어받습니다. 한도를 늘리려면:

1. 공공데이터포털 → 마이페이지 → 활용신청 현황 → 해당 API → **운영계정 신청**
2. 서비스 URL(배포 주소)과 활용 목적을 적어 제출. 한국관광공사 담당자 승인 후 한도가 크게 늘어납니다 (보통 수만 회/일).
3. 키는 그대로 쓰고 별도 변경 없이 적용됩니다.

### 데이터에서 확인된 특이사항

- 실제 응답에서 `areacode` 는 비어 있고 `lDongRegnCd`(법정동 시도 코드)만 옵니다. 지역은 주소 첫 단어로 판별하고, 없으면 이 코드로 보완합니다.
- 2026년 응답에 `전남광주통합특별시` 주소가 등장합니다. 시군구가 구(區)면 광주, 아니면 전남으로 분류합니다 (`lib/regions.ts`).
- 120일 이상 이어지는 상설 공연·전시는 목록 뒤로 보내고 "상설"로 표시합니다.
- 내년 달은 아직 등록이 적어(5개 미만) 올해 같은 달 축제를 참고용으로 함께 보여줍니다. 매년 열리는 축제가 많아 실제로 유용합니다.

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

`.github/workflows/update-festivals.yml` 이 매주 월요일 04:00 KST 에 실행됩니다.

1. GitHub 저장소 → Settings → Secrets and variables → Actions → **New repository secret**
2. `TOUR_API_KEY` (관광공사 디코딩 키) 와 `KOPIS_API_KEY` (KOPIS 키) 두 개를 등록
3. Actions 탭에서 **축제 데이터 갱신** 워크플로를 `Run workflow` 로 한 번 수동 실행해 확인

변경이 있으면 `데이터: 축제 정보 자동 갱신 (N건)` 커밋이 올라가고 Vercel 이 다시 배포합니다.

## 4. overrides.json 편집법

API 에 없는 축제를 추가하거나 잘못된 정보를 고칠 때 `data/overrides.json` 을 편집합니다.
수집 스크립트가 festivals.json 을 덮어써도 overrides 는 유지되며, 빌드 시 병합됩니다.

```json
{
  "festivals": [
    {
      "id": "2673464",
      "endDate": "2026-10-12",
      "homepage": "https://example.go.kr/festival"
    },
    {
      "id": "manual-hongdae-busking",
      "title": "홍대 거리 버스킹 위크",
      "startDate": "2026-10-10",
      "endDate": "2026-10-12",
      "sido": "서울",
      "sigungu": "마포구",
      "address": "서울특별시 마포구 홍익로 일대",
      "image": "https://tong.visitkorea.or.kr/cms/resource/00/000000_image2_1.jpg",
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
- `tags` 를 직접 주면 자동 분류 대신 그 값을 씁니다. 사용 가능한 값: `먹거리`, `불꽃/야경`, `꽃/자연`, `문화/전통`, `음악/공연`, `봄`, `여름`, `가을`, `겨울`
- 이미지는 `tong.visitkorea.or.kr` 도메인만 next/image 최적화를 거칩니다. 다른 도메인은 그대로 표시됩니다.

## 프로젝트 구조

```
app/                    페이지 (App Router)
  page.tsx              홈 (12개월 그리드)
  month/[month]/        월별 목록 + OG 이미지
  festival/[id]/        상세 + OG 이미지
  region/[sido]/        지역별 + OG 이미지
  search/               검색
  sitemap.ts, robots.ts
components/             UI 컴포넌트 (FestivalList 는 클라이언트 필터)
lib/
  types.ts              Festival / API 응답 타입
  date.ts               KST 오늘, D-day, "9월 21일 (일)" 형식, 걸치는 달 계산
  regions.ts            시도 매핑 · 주소 파싱
  tags.ts               키워드 기반 카테고리 태그
  normalize.ts          API 응답 → Festival 정규화
  festivals.ts          festivals.json + overrides.json 병합, 조회 함수
  og.tsx                OG 이미지 공용 (한글 폰트 로드)
scripts/
  fetch-festivals.ts    데이터 수집
  probe-api.ts          API 응답 구조 확인
  make-sample-data.ts   샘플 데이터
data/
  festivals.json        수집 결과 (자동 생성)
  overrides.json        수동 보정
tests/                  node:test 단위 테스트
```

## 출처

데이터 제공: **한국관광공사** (TourAPI 4.0). 축제 일정·요금은 주최 측 사정으로 변경될 수 있습니다.

## 운영 메모 (실제 배포에서 확인한 것)

- **GitHub Actions 에서는 `npm ci` 가 아니라 `npm install` 을 쓴다.** Windows 에서 만든 `package-lock.json` 에
  리눅스 러너용 선택적 의존성(`@emnapi/*`)이 빠져 있어 `npm ci` 가 `Missing ... from lock file` 로 실패한다.
- **해외 러너에서 `apis.data.go.kr` 접속이 느리다.** Node 기본 연결 타임아웃 10초로는 `ConnectTimeoutError` 가 난다.
  `scripts/tour-api.ts` 가 undici Agent 로 연결 60초·헤더/본문 120초를 잡고 5회까지 재시도한다.
- 이 두 가지를 고친 뒤 워크플로가 수집 → 커밋 → Vercel 자동 배포까지 정상 동작하는 것을 확인했다.
