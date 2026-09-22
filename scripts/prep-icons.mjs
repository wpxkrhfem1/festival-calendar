/**
 * 생성 원본 아이콘을 실제로 쓸 크기로 정리한다.
 *   node scripts/prep-icons.mjs
 *
 * - 투명 여백을 잘라내고 (trim) 정사각 캔버스 가운데에 다시 놓는다
 * - 256px 로 줄여 파일을 가볍게 만든다
 * - public/icons/ 에 저장한다 (실제 서비스에서 쓰는 경로)
 *
 * 원본 1MB 가 넘는 PNG 를 그대로 쓰면 44px 로 그리는데 낭비가 크다.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "public", "brand", "icons");
const OUT = path.join(process.cwd(), "public", "icons");
const SIZE = 256;

async function prep(file) {
  const name = path.basename(file, ".png");
  const src = path.join(SRC, file);

  // 투명 여백 제거 → 긴 쪽을 기준으로 줄이고 → 정사각 가운데 배치
  const trimmed = await sharp(src).trim({ threshold: 12 }).toBuffer();
  const meta = await sharp(trimmed).metadata();
  const long = Math.max(meta.width ?? SIZE, meta.height ?? SIZE);
  const inner = Math.round(SIZE * 0.88); // 사방에 약간 여백을 남긴다

  await sharp(trimmed)
    .resize({
      width: Math.round(((meta.width ?? 1) / long) * inner),
      height: Math.round(((meta.height ?? 1) / long) * inner),
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer()
    .then((buf) =>
      sharp({
        create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: buf, gravity: "center" }])
        .png({ compressionLevel: 9, palette: true })
        .toFile(path.join(OUT, `${name}.png`)),
    );

  const kb = fs.statSync(path.join(OUT, `${name}.png`)).size / 1024;
  console.log(`[done] ${name}.png  ${kb.toFixed(0)} KB`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png"));
  for (const f of files) await prep(f);
  const total = fs.readdirSync(OUT).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(`[total] ${files.length}개, 합계 ${(total / 1024).toFixed(0)} KB`);
}

main().catch((err) => {
  console.error("[error]", err.message);
  process.exit(1);
});
