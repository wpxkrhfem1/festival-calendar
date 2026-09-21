/**
 * OG 이미지 공용 유틸 (next/og ImageResponse)
 * - 기본 폰트에는 한글 글리프가 없어 Google Fonts 에서 Noto Sans KR 을 텍스트 서브셋으로 받아 쓴다.
 * - 폰트 로드에 실패해도 빌드가 깨지지 않도록 try/catch 후 폰트 없이 렌더링한다.
 */
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** 텍스트에 필요한 글자만 포함한 Noto Sans KR(Bold) TTF 를 가져온다 */
export async function loadKoreanFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const unique = [...new Set(text + "전국 축제 달력 · 데이터 제공 한국관광공사 이번 달 한눈에 총정리 0123456789개")].join("");
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(unique)}`;
    const css = await (await fetch(cssUrl)).text();
    const m = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:opentype|truetype)'\)/);
    if (!m) return null;
    const res = await fetch(m[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

interface OgCardProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** 오른쪽에 넣을 대표 이미지 URL (선택) */
  image?: string;
}

/** 공통 OG 카드 레이아웃 */
export function OgCard({ eyebrow, title, subtitle, image }: OgCardProps): ReactElement {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #f25a2a 0%, #ff9a5a 60%, #ffd166 100%)",
        fontFamily: '"Noto Sans KR", sans-serif',
        color: "#fff",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 72px", width: image ? "62%" : "100%" }}>
        <div style={{ fontSize: 30, opacity: 0.9, marginBottom: 18, display: "flex" }}>{eyebrow}</div>
        <div style={{ fontSize: title.length > 18 ? 60 : 76, fontWeight: 700, lineHeight: 1.15, display: "flex", wordBreak: "keep-all" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 30, marginTop: 24, opacity: 0.95, display: "flex", wordBreak: "keep-all" }}>{subtitle}</div>}
        <div style={{ position: "absolute", left: 72, bottom: 44, fontSize: 24, opacity: 0.85, display: "flex" }}>🎪 전국 축제 달력 · 데이터 제공 한국관광공사</div>
      </div>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" style={{ width: "38%", height: "100%", objectFit: "cover" }} />
      )}
    </div>
  );
}

/** ImageResponse 생성 (폰트 로드 포함) */
export async function renderOg(element: ReactElement, fontText: string): Promise<ImageResponse> {
  const font = await loadKoreanFont(fontText);
  return new ImageResponse(element, {
    ...OG_SIZE,
    fonts: font ? [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }] : undefined,
  });
}
