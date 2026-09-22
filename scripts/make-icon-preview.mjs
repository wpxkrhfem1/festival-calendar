/**
 * 생성한 아이콘을 검증하기 좋은 HTML 로 묶는다 (개발 보조).
 *   node scripts/make-icon-preview.mjs
 *
 * 실제 타일 위 모습, 실제 크기, 밝은/어두운 배경을 한 화면에 놓는다.
 * 이미지를 base64 로 심어 서버 없이 열린다.
 */
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "icons"); // 정리된 256px 버전

const FESTIVAL = [
  ["food", "먹거리", "#FDBA74", "#FB923C"],
  ["firework", "불꽃/야경", "#C4B5FD", "#A78BFA"],
  ["nature", "꽃/자연", "#86EFAC", "#4ADE80"],
  ["culture", "문화/전통", "#FDA4AF", "#FB7185"],
  ["music", "음악/공연", "#93C5FD", "#60A5FA"],
];
const CONCERT = [
  ["classic", "클래식", "#FCD34D", "#FBBF24"],
  ["musical", "뮤지컬", "#C4B5FD", "#A78BFA"],
  ["pop", "대중음악", "#F0ABFC", "#E879F9"],
  ["play", "연극", "#FDA4AF", "#FB7185"],
  ["gugak", "국악", "#6EE7B7", "#34D399"],
  ["magic", "서커스/마술", "#7DD3FC", "#38BDF8"],
];

const b64 = (name) => fs.readFileSync(path.join(DIR, `${name}.png`)).toString("base64");

function tiles(list, soft) {
  return list
    .map(([n, label, c1, c2]) => {
      const bg = soft ? `background:linear-gradient(135deg,${c1}33,${c2}33)` : `background:linear-gradient(135deg,${c1},${c2})`;
      return `<li class="tile">
  <span class="box" style="${bg}"><img src="data:image/png;base64,${b64(n)}" alt="${label}"></span>
  <b>${label}</b></li>`;
    })
    .join("");
}

function raw(list) {
  return list
    .map(([n, label]) => `<div class="one"><img src="data:image/png;base64,${b64(n)}" alt="${label}"><span>${label}</span></div>`)
    .join("");
}

function real(list) {
  return list
    .map(([n, , c1, c2]) => `<span class="rbox" style="background:linear-gradient(135deg,${c1}33,${c2}33)"><img src="data:image/png;base64,${b64(n)}"></span>`)
    .join("");
}

const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>아이콘 검증</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
 body{margin:0;padding:26px 20px 80px;background:#f4f4f5;color:#18181b;
      font-family:"Pretendard Variable",Pretendard,sans-serif}
 .wrap{max-width:1000px;margin:0 auto}
 h1{font-size:21px;margin:0 0 4px}
 h2{font-size:15px;margin:30px 0 10px}
 h2 small{font-weight:400;color:#71717a;margin-left:6px}
 .sub{color:#71717a;font-size:13.5px;margin:0 0 20px;line-height:1.7}
 .card{background:#fff;border:1px solid #e4e4e7;border-radius:16px;padding:16px}
 .card.dark{background:#0b0b0e;border-color:#27272a}
 ul{list-style:none;margin:0;padding:0;display:grid;gap:12px}
 ul.f{grid-template-columns:repeat(5,1fr)} ul.c{grid-template-columns:repeat(6,1fr)}
 .tile{text-align:center}
 .tile .box{display:flex;align-items:center;justify-content:center;
            width:100%;aspect-ratio:1;border-radius:20px;overflow:hidden}
 .tile .box img{width:74%;height:74%;object-fit:contain}
 .tile b{display:block;font-size:11.5px;margin-top:7px}
 .card.dark .tile b{color:#fafafa}
 .rawrow{display:flex;gap:14px;flex-wrap:wrap;margin-top:4px}
 .one{width:104px;text-align:center}
 .one img{width:104px;height:104px;object-fit:contain;background:#fff;border-radius:12px;border:1px solid #e4e4e7}
 .one span{display:block;font-size:11px;color:#71717a;margin-top:5px}
 .realrow{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
 .rbox{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;overflow:hidden}
 .rbox img{width:74%;height:74%;object-fit:contain}
 .note{background:#fff;border:1px solid #e4e4e7;border-radius:14px;padding:13px 16px;
       font-size:13px;line-height:1.85;margin-top:18px;color:#3f3f46}
 .note b{color:#18181b}
</style></head><body>
<div class="wrap">
 <h1>아이콘 검증</h1>
 <p class="sub">OpenAI gpt-image-1 로 <b>한 장에 하나씩</b> 따로 뽑았습니다. 잘림이 없고 여백이 고릅니다.<br>
  타일 배경은 연하게 깔아 아이콘 색이 살도록 했습니다.</p>

 <h2>축제 카테고리 <small>연한 타일 위</small></h2>
 <div class="card"><ul class="f">${tiles(FESTIVAL, true)}</ul></div>

 <h2>공연 장르 <small>연한 타일 위</small></h2>
 <div class="card"><ul class="c">${tiles(CONCERT, true)}</ul></div>

 <h2>어두운 배경에서</h2>
 <div class="card dark"><ul class="f">${tiles(FESTIVAL, true)}</ul></div>
 <div class="card dark" style="margin-top:12px"><ul class="c">${tiles(CONCERT, true)}</ul></div>

 <h2>실제 크기 <small>44px — 모바일에서 보이는 크기</small></h2>
 <div class="card"><div class="realrow">${real(FESTIVAL)}${real(CONCERT)}</div></div>

 <h2>원본 <small>배경 없이</small></h2>
 <div class="card"><div class="rawrow">${raw(FESTIVAL)}${raw(CONCERT)}</div></div>

 <div class="note">
  <b>봐주실 것</b><br>
  44px 줄에서 형태가 뭉개지지 않는지, 11개가 한 세트로 보이는지가 핵심입니다.<br>
  이상한 게 있으면 <b>그 이름만</b> 말씀해 주세요. 그것만 다시 뽑겠습니다.<br>
  이름: 먹거리 불꽃 꽃 문화 음악 / 클래식 뮤지컬 대중음악 연극 국악 마술
 </div>
</div>
</body></html>`;

const out = path.join(process.env.TEMP ?? process.cwd(), "아이콘_검증.html");
fs.writeFileSync(out, html, "utf8");
console.log("저장:", out, `${(fs.statSync(out).size / 1048576).toFixed(0)}MB`);
