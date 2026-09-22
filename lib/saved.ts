"use client";

/**
 * 찜 목록 저장소 (브라우저 localStorage).
 *
 * 로그인 없이 쓰는 게 목적이라 서버에 보내지 않는다.
 * 여러 컴포넌트가 같은 값을 보게 useSyncExternalStore 로 구독하고,
 * 다른 탭에서 바뀐 것도 storage 이벤트로 따라간다.
 */

export type SavedKind = "festival" | "concert";

const KEY = "saved:v1";
const EVENT = "saved:changed";

interface SavedData {
  festival: string[];
  concert: string[];
}

const EMPTY: SavedData = { festival: [], concert: [] };

/** 스냅샷 캐시. useSyncExternalStore 는 같은 값이면 같은 참조를 돌려줘야 무한 렌더를 피한다 */
let cache: SavedData = EMPTY;
let cacheRaw = "";

function read(): SavedData {
  if (typeof window === "undefined") return EMPTY;
  let raw = "";
  try {
    raw = window.localStorage.getItem(KEY) ?? "";
  } catch {
    return EMPTY; // 시크릿 모드 등 저장소 접근 불가
  }
  if (raw === cacheRaw) return cache;

  let next: SavedData = EMPTY;
  try {
    const parsed = JSON.parse(raw || "{}") as Partial<SavedData>;
    next = {
      festival: Array.isArray(parsed.festival) ? parsed.festival : [],
      concert: Array.isArray(parsed.concert) ? parsed.concert : [],
    };
  } catch {
    next = EMPTY;
  }
  cacheRaw = raw;
  cache = next;
  return next;
}

function write(data: SavedData): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* 저장 못 해도 화면은 계속 동작하게 둔다 */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeSaved(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getSavedSnapshot(): SavedData {
  return read();
}

/** 서버 렌더링 때는 항상 빈 목록 (하이드레이션 불일치 방지) */
export function getSavedServerSnapshot(): SavedData {
  return EMPTY;
}

export function isSaved(kind: SavedKind, id: string): boolean {
  return read()[kind].includes(id);
}

/** 찜 토글. 새 상태(찜했으면 true)를 돌려준다 */
export function toggleSaved(kind: SavedKind, id: string): boolean {
  const data = read();
  const list = data[kind];
  const has = list.includes(id);
  const next: SavedData = {
    ...data,
    // 최근에 찜한 것이 앞에 오도록 앞에 붙인다
    [kind]: has ? list.filter((x) => x !== id) : [id, ...list],
  };
  write(next);
  return !has;
}

export function clearSaved(kind?: SavedKind): void {
  const data = read();
  write(kind ? { ...data, [kind]: [] } : EMPTY);
}

export function savedCount(data: SavedData): number {
  return data.festival.length + data.concert.length;
}
