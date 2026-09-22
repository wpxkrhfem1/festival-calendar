/**
 * OpenAI 이미지 API 로 로고·아이콘 후보를 생성한다 (개발 보조).
 *   node scripts/gen-brand.mjs <키> [장수]
 *   키: logoA | logoB | logoC | icons | all
 *
 * 키는 Desktop/kaii-yawacho/.env 의 OPENAI_API_KEY 를 읽는다.
 * 결과는 public/brand/ 에 PNG 로 저장한다.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ENV_PATH = path.join(os.homedir(), "Desktop", "kaii-yawacho", ".env");
const OUT_DIR = path.join(process.cwd(), "public", "brand");

function getKey() {
  const line = fs
    .readFileSync(ENV_PATH, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("OPENAI_API_KEY="));
  const key = line?.slice("OPENAI_API_KEY=".length).replace(/^["']|["']$/g, "").trim();
  if (!key) throw new Error("OPENAI_API_KEY 를 찾지 못했습니다.");
  return key;
}

/** 모든 프롬프트에 공통으로 붙이는 품질 지시 */
const QUALITY = `
Design quality: premium brand identity work by a senior designer.
Sophisticated color harmony, confident negative space, precise geometry,
subtle depth through layered flat shapes and gentle tonal shifts.
Not clipart. Not emoji. Not generic stock iconography.
Absolutely no text, no letters, no numbers, no watermarks.`;

const PROMPTS = {
  /** A — 전통 인장(도장) 컨셉 */
  logoA: {
    size: "1024x1024",
    file: "logoA",
    background: "opaque",
    prompt: `A premium app icon for a Korean festival discovery service.

Concept: a modern reinterpretation of a Korean traditional seal stamp (inkan).
A softly rounded square tile in deep persimmon red with a subtle darker
vignette toward the corners. Centered inside, carved out in warm ivory:
a stylized cheongsachorong lantern, its body built from clean geometric
facets, with a short tassel below.

A fine ivory border sits just inside the tile edge, like a seal frame.
Two small ivory dots flank the lantern for balance.

Palette: deep persimmon red, warm ivory, a single thread of gold.
${QUALITY}
Centered square composition with generous white margin around the tile.
Must remain clearly readable at 32 pixels.`,
  },

  /** B — 단청 색의 빛나는 등불 */
  logoB: {
    size: "1024x1024",
    file: "logoB",
    background: "opaque",
    prompt: `A premium app icon for a Korean festival discovery service.

Concept: a glowing festival lantern at night, rendered as refined flat
vector art with depth. A rounded square tile carrying a rich gradient from
deep indigo at the top to warm plum at the bottom.

Centered: a cheongsachorong lantern whose body is banded in dancheong
colors — cobalt blue, jade green, and vermilion — with a warm amber glow
emanating from within. The glow is built from two or three concentric
soft shapes, not a blur.

Above and beside the lantern, three small asymmetric light sparks.

Palette: deep indigo, plum, cobalt, jade, vermilion, amber.
${QUALITY}
Centered square composition with generous white margin around the tile.
Must remain clearly readable at 32 pixels.`,
  },

  /** C — 추상 마크 (등불 + 꽃잎) */
  logoC: {
    size: "1024x1024",
    file: "logoC",
    background: "opaque",
    prompt: `A premium abstract logo mark for a Korean festival discovery service.

Concept: a single continuous geometric mark that reads as both a hanging
festival lantern and an opening flower. Built from five tapered petal
shapes arranged around a warm glowing core, with a short stem above and
a small weight below, giving it the silhouette of a lantern.

Rendered on a rounded square tile with a warm sunset gradient from
tangerine to rose. The mark itself is warm ivory with one petal picked out
in soft gold for depth.

Palette: tangerine, rose, warm ivory, soft gold.
${QUALITY}
Centered square composition with generous white margin around the tile.
Must remain clearly readable at 32 pixels.`,
  },

  /** 카테고리 아이콘 5종 */
  icons: {
    size: "1536x1024",
    file: "icons",
    prompt: `One image containing exactly 5 premium vector icons in a single
horizontal row, evenly spaced, large, on a plain white background.

Icons, strictly left to right:
1. a Korean street food skewer, three glazed rice cakes on a wooden stick,
   two thin curls of steam rising
2. a firework bursting at night, a bright core with tapered rays and a few
   drifting embers
3. a cherry blossom, five notched petals with a fine stamen cluster
4. a Korean talchum mask, warm face with a dancheong-banded headdress and
   a calm smile
5. a vintage microphone with two music notes arcing away from it

Apply identically to all 5:
- refined flat vector illustration with subtle depth: each icon uses one
  base color plus a slightly darker tone for shadow planes and a lighter
  tone for highlights, all flat, no blurs
- confident thick shapes with crisp rounded corners, no thin hairlines
- each icon fits the same invisible square and carries equal visual weight
- generous even spacing, nothing touching or overlapping

Shared palette across the set so they read as one family: tangerine,
amber, coral rose, jade green, cobalt blue, warm ivory.
${QUALITY}
Each icon must stay clearly readable at 48 pixels tall.`,
  },
  /** 공연 장르 아이콘 6종 */
  genres: {
    size: "1536x1024",
    file: "genres",
    prompt: `One image containing exactly 6 premium vector icons in a single
horizontal row, evenly spaced, large, with clear margin at both ends,
on a plain white background.

Icons, strictly left to right:
1. a grand piano seen from above with a treble clef, for classical music
2. a theatre stage with an open curtain and a spotlight beam, for musicals
3. a stage microphone with a burst of confetti, for popular music concerts
4. two classic theatre masks, one calm and one bright, for plays
5. a Korean traditional gayageum zither with a plum blossom, for gugak
6. a top hat with a magic wand and three sparks, for circus and magic

Apply identically to all 6:
- refined flat vector illustration with subtle depth: one base color plus a
  darker tone for shadow planes and a lighter tone for highlights, all flat
- confident thick shapes with crisp rounded corners, no thin hairlines
- each icon fits the same invisible square and carries equal visual weight
- generous even spacing, nothing touching, nothing cropped at the edges

Shared palette so the six read as one family: violet, indigo, magenta,
amber, jade, warm ivory.
${QUALITY}
Each icon must stay clearly readable at 48 pixels tall.`,
  },
};

async function generate(keyName, n) {
  const spec = PROMPTS[keyName];
  if (!spec) throw new Error(`알 수 없는 키: ${keyName}`);

  console.log(`[info] ${keyName} 생성 중 (${n}장, ${spec.size})…`);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: spec.prompt,
      size: spec.size,
      n,
      background: spec.background ?? "transparent",
      output_format: "png",
      quality: "high",
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error(`[error] ${keyName}:`, JSON.stringify(json).slice(0, 400));
    return;
  }
  json.data.forEach((d, i) => {
    const out = path.join(OUT_DIR, `${spec.file}-${i + 1}.png`);
    fs.writeFileSync(out, Buffer.from(d.b64_json, "base64"));
    console.log(`[done] ${path.basename(out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
  });
}

async function main() {
  const which = process.argv[2];
  const n = Number(process.argv[3]) || 2;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const keys = which === "all" ? ["icons", "genres"] : [which];
  for (const k of keys) await generate(k, n);
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
