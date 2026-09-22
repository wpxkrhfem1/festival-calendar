/**
 * 카테고리·장르 아이콘을 OpenAI 로 1개씩 따로 생성한다.
 *   node scripts/gen-icons.mjs [키...]
 *   키를 안 주면 전부 생성한다.
 *
 * 시트 한 장에 여러 개를 넣으면 가장자리가 잘리고 간격이 안 맞아서,
 * 아이콘 하나당 정사각 이미지 한 장으로 뽑는다.
 * 배경은 투명이고, 타일 위에 올릴 수 있도록 색을 가진 완성 아이콘이다.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ENV_PATH = path.join(os.homedir(), "Desktop", "kaii-yawacho", ".env");
const OUT_DIR = path.join(process.cwd(), "public", "brand", "icons");

function getKey() {
  const line = fs
    .readFileSync(ENV_PATH, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith("OPENAI_API_KEY="));
  const key = line?.slice("OPENAI_API_KEY=".length).replace(/^["']|["']$/g, "").trim();
  if (!key) throw new Error("OPENAI_API_KEY 를 찾지 못했습니다.");
  return key;
}

/** 모든 아이콘에 똑같이 붙여 한 세트로 보이게 하는 지시 */
const STYLE = `
Rendering rules, followed exactly:
- one single icon, centered, on a fully transparent background
- modern flat vector illustration with subtle depth: one base color, a
  darker tone for shadow planes, a lighter tone for highlights, all flat
- confident thick shapes, crisp rounded corners, no thin hairlines
- no outlines around the whole icon, no drop shadow, no glow, no blur
- no background shape, no circle or square behind the icon
- nothing touches the image edges: leave at least 15% empty margin on all sides
- absolutely no text, no letters, no numbers, no watermark
- designed as a premium app category icon, clearly readable at 40 pixels
- square composition`;

const ICONS = {
  // 축제 카테고리 5종 — 따뜻한 계열
  food: `A skewer of three glazed Korean rice cakes on a wooden stick, held at a
slight diagonal, with two thin curls of steam rising from the top.
Palette: tangerine, amber, warm brown stick, ivory highlights.${STYLE}`,

  firework: `A single firework bursting: a bright core with eight tapered rays
radiating outward and three small embers drifting away.
Palette: amber, coral rose, deep violet, ivory core.${STYLE}`,

  nature: `A single cherry blossom seen face on: five notched petals around a
small center with a few fine stamens.
Palette: coral rose, blush pink, amber center, ivory highlights.${STYLE}`,

  culture: `A Korean talchum mask seen straight on, drawn with very few,
very bold shapes so it stays readable when tiny.
A simple rounded face. Two thick crescent eyes curving up in a smile.
One thick curved smile line. Two solid round cheek dots.
A single wide band of color straight across the forehead, with no pattern
inside it. Nothing else: no eyebrows, no nose, no hair, no wrinkles,
no fine lines, no small details anywhere.
Palette: warm ivory face, one vermilion headband, deep brown features,
coral cheeks.${STYLE}`,

  art: `An artist palette seen at a slight angle with three dabs of paint on it
and a single slim brush resting across it.
Palette: violet palette body, amber and coral and jade paint dabs,
ivory brush.${STYLE}`,

  music: `A vintage stage microphone standing upright, with two music notes
arcing away from its upper right.
Palette: cobalt blue body, jade accents, amber notes, ivory highlights.${STYLE}`,

  // 공연 장르 6종 — 차가운 계열
  classic: `A grand piano seen from a three quarter angle with its lid raised,
keys visible along the front edge.
Palette: deep indigo body, ivory keys, amber inner lid.${STYLE}`,

  musical: `A theatre stage: two draped curtains pulled open to the sides with a
tied sash on each, revealing a bright empty stage between them.
Palette: magenta and plum curtains, amber stage light, ivory highlights.${STYLE}`,

  pop: `A handheld stage microphone held at a diagonal, with a small burst of
confetti pieces flying from the top.
Palette: magenta body, violet accents, amber and jade confetti.${STYLE}`,

  play: `Two overlapping classic theatre masks, the front one smiling and the
back one calm, offset so both are clearly visible.
Palette: ivory front mask, rose back mask, indigo features.${STYLE}`,

  gugak: `A Korean gayageum zither seen from a three quarter angle, its long
curved body strung with several fine strings, one plum blossom resting near
the wide end.
Palette: warm wood brown body, jade strings, blush plum blossom.${STYLE}`,

  magic: `A magician's top hat sitting upright with a slim wand crossed behind
it and three small sparkles above the brim.
Palette: indigo hat, jade hatband, amber sparkles, ivory wand tips.${STYLE}`,
};

async function generate(name) {
  const prompt = ICONS[name];
  if (!prompt) throw new Error(`알 수 없는 아이콘: ${name}`);

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getKey()}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: Number(process.env.ICON_N) || 1,
      background: "transparent",
      output_format: "png",
      quality: "high",
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error(`[error] ${name}:`, JSON.stringify(json).slice(0, 300));
    return;
  }
  json.data.forEach((d, i) => {
    const file = json.data.length > 1 ? `${name}-${i + 1}.png` : `${name}.png`;
    const out = path.join(OUT_DIR, file);
    fs.writeFileSync(out, Buffer.from(d.b64_json, "base64"));
    console.log(`[done] ${file} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const names = process.argv.slice(2);
  const targets = names.length ? names : Object.keys(ICONS);
  console.log(`[info] ${targets.length}개 생성 시작`);
  // 동시 3개씩 (API 부담을 줄이면서 속도는 확보)
  for (let i = 0; i < targets.length; i += 3) {
    await Promise.all(targets.slice(i, i + 3).map(generate));
  }
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
