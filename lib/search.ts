/**
 * 검색어 해석
 *
 * 검색은 공백으로 끊어 AND 부분일치로 찾는다. 이게 한국어에서 한 가지를 놓친다.
 * "가을축제" 는 0건인데 "가을 축제" 는 128건이 나왔다 — 띄어쓰기 하나 차이다.
 * 우리말은 붙여 쓰는 쪽이 더 자연스러운데 그쪽이 0건이었다.
 *
 * 그래서 원래 검색어로 먼저 찾고, 한 건도 없을 때만 "축제/페스티벌/콘서트" 같은
 * 흔한 꼬리말을 떼어내서 다시 찾는다. 처음부터 느슨하게 찾으면 정확히 친 사람의
 * 결과까지 흐려지므로 순서를 지킨다.
 */

/** 검색어 끝에 붙는 흔한 말. 긴 것부터 본다 ("대축제" 가 "축제" 보다 먼저) */
const TAIL_WORDS = [
  "페스티벌",
  "페스타",
  "대축제",
  "문화제",
  "콘서트",
  "박람회",
  "전시회",
  "축제",
  "공연",
  "행사",
  "마켓",
  "페어",
];

/** 검색어를 토큰으로. 꼬리말이 붙어 있으면 떼어 두 토큰으로 나눈다 */
function splitTail(term: string): string[] {
  for (const tail of TAIL_WORDS) {
    // 꼬리말만 남으면 안 된다 ("축제" 한 단어로 검색하면 그대로 둔다)
    if (term.length > tail.length && term.endsWith(tail)) {
      return [term.slice(0, -tail.length), tail];
    }
  }
  return [term];
}

export function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** 꼬리말을 떼어낸 토큰 목록. 뗄 게 없으면 null (다시 찾을 필요가 없다는 뜻) */
export function relaxedTokens(query: string): string[] | null {
  const terms = tokenize(query);
  if (terms.length === 0) return null;
  const out = terms.flatMap(splitTail);
  return out.length > terms.length ? out : null;
}

/**
 * 항목 하나가 모든 토큰을 품는지 (AND 부분일치).
 * haystack 은 미리 소문자로 만들어 넘긴다.
 */
export function matchesAll(haystack: string, terms: string[]): boolean {
  return terms.every((t) => haystack.includes(t));
}

/**
 * 두 단계 검색. 원래 검색어로 먼저, 0건이면 꼬리말을 떼고 한 번 더.
 * 어느 쪽으로 찾았는지 함께 돌려줘서 화면에 알려줄 수 있게 한다.
 */
export function searchIn<T>(
  items: T[],
  query: string,
  haystackOf: (item: T) => string,
): { results: T[]; relaxed: boolean } {
  const terms = tokenize(query);
  if (terms.length === 0) return { results: [], relaxed: false };

  const exact = items.filter((it) => matchesAll(haystackOf(it).toLowerCase(), terms));
  if (exact.length > 0) return { results: exact, relaxed: false };

  const loose = relaxedTokens(query);
  if (!loose) return { results: [], relaxed: false };

  return { results: items.filter((it) => matchesAll(haystackOf(it).toLowerCase(), loose)), relaxed: true };
}
