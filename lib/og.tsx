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

/**
 * 앱 아이콘 (홈 화면에 추가했을 때 보이는 정사각형).
 *
 * 로고가 글자 워드마크라 이미지 파일이 없다. 공유 이미지와 같은 그라데이션에
 * "축제" 두 글자만 얹는다. 안드로이드는 아이콘을 원·물방울 모양으로 잘라내므로
 * 글자를 가운데 80% 안에 들어가게 작게 둔다 (한 변의 30%).
 */
export async function renderAppIcon(size: number): Promise<ImageResponse> {
  const font = await loadKoreanFont("축제");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f25a2a 0%, #ff9a5a 60%, #ffd166 100%)",
          color: "#fff",
          fontFamily: '"Noto Sans KR", sans-serif',
          fontSize: Math.round(size * 0.3),
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        축제
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: font ? [{ name: "Noto Sans KR", data: font, weight: 700, style: "normal" }] : undefined,
    },
  );
}
