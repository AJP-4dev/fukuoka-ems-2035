/* lib.js — 全章共通の基盤（classic script）。scene.html が window.THREE を用意してから読み込む。
 * ここで宣言した const/function はグローバル（全章ファイルから直接使える）。
 * 章ファイル側は必ず IIFE で包み、トップレベルに名前を宣言しないこと（衝突すると全体が止まる）。
 * 関数一覧と使い方は ../CONTRACT.md を参照。 */
const THREE = window.THREE;
/* ══════════════════════════════════════════════════════════════
   共通: 定数・色・イージング
   ══════════════════════════════════════════════════════════════ */
const W = 1920, H = 1080, M = 80;
const COL = { bg: '#f4f6f9', paper: '#ffffff', ink: '#14213d', sub: '#5b6b82', faint: '#8e9bae',
  navy: '#14213d', red: '#e63946', purple: '#8e3b8f', orange: '#f4a259', green: '#1b998b',
  blue: '#3a7bd5', sky: '#9ad0f5', line: '#dfe4ec', grid: '#e3e8ef', grey: '#c9d2de' };
const AGE = ['k', 'j', 'w', 'e1', 'e2', 'e3'];   // = DATA.groups（福岡: 6帯）
const AGEC = { k: '#9ad0f5', j: '#bfd7f2', w: '#3a7bd5', e1: '#f4a259', e2: '#e63946', e3: '#8e3b8f' };
const AGEL = { k: '0–6歳', j: '7–17歳', w: '18–64歳', e1: '65–74歳', e2: '75–84歳', e3: '85歳以上' };
const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';
const NUM = '"Avenir Next","Helvetica Neue","Hiragino Sans",sans-serif';

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, u) => a + (b - a) * u;
const E = {
  outCubic: (u) => 1 - Math.pow(1 - u, 3),
  outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  outBack: (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
};
const P = (t, a, d) => clamp((t - a) / d);                  // 進捗 0..1
const ein = (t, a, d = 0.8) => E.outCubic(P(t, a, d));       // cubic-out
const eio = (t, a, d = 1) => E.inOut(P(t, a, d));            // ease-in-out（カメラ）
const cnt = (t, a, d = 1.2) => E.outExpo(P(t, a, d));        // カウンター
const win = (t, a, b, f = 0.25) => Math.min(clamp((t - a) / f), clamp((b - t) / f)); // 区間の可視度

/* 色 */
const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
const mix = (a, b, u) => { const A = hexRGB(a), B = hexRGB(b); return rgbHex(A.map((v, i) => v + (B[i] - v) * u)); };
const ramp = (stops, t) => { t = clamp(t); const n = stops.length - 1; const i = Math.min(n - 1, Math.floor(t * n)); return mix(stops[i], stops[i + 1], t * n - i); };
const RAMPS = { disp: ['#dbe7f3', '#7fa6d6', '#3a5f99', '#14213d'], diff: ['#1b998b', '#d8dee7', '#f4a259', '#e63946'] };
const rampDisp = (v) => ramp(RAMPS.disp, (v - 7000) / 16000);
// 増減率の発散ランプ: 0%＝ほぼ白、＋は橙→赤、−は緑
const rampDiv = (v, hi = 15, lo = -12) => (v >= 0 ? ramp(['#e6eaf0', '#f4a259', '#e63946'], v / hi) : mix('#e6eaf0', '#1b998b', clamp(v / lo)));

/* ══════════════════════════════════════════════════════════════
   データ（DATA から計算）
   ══════════════════════════════════════════════════════════════ */
// 福岡版: 区は 東・博多・中央・南・城南・早良・西 の7区。年キーはすべて文字列（'2025'）。
// 下の関数は年を数値でも文字列でも受け取り、内部で String(y) にする。
const WD = DATA.wards;
const TR = DATA.trend;                                 // {slopePre, slopeAll, capYear, adjRate, backtest, ageShare}
const SER = DATA.series;                               // {dispatch, transport, units}（2013–2024）
const STD = DATA.standard;                             // 整備指針 {coef, demandPop, units{y}, current:34, crossYear}
const ST = DATA.stations;                              // 署所31（推定）
const yk = (y) => String(y);
const WI = Object.fromEntries(WD.map((w, i) => [w.name, i]));
const ward = (n) => WD[WI[n]];
const popT = (w, y) => AGE.reduce((s, a) => s + w.pop[yk(y)][a], 0);
const sumW = (f) => WD.reduce((s, w) => s + f(w), 0);
const D24 = SER.dispatch['2024'];                      // 100,181（2024年実績）
const PER_DAY = D24 / 366;                             // 2024年はうるう年 → 274件/日
const INTERVAL = 86400 / PER_DAY;                      // 秒（5分15秒）
const YEARS = []; for (let y = 2025; y <= 2050; y++) YEARS.push(y);
const dispA = (w, y) => w.disp[yk(y)];                 // 区の出場（下限＝人口変化のみ）。2025は推計値
const SC = {                                            // 市全体の出場シナリオ
  L: (y) => sumW((w) => dispA(w, y)),                                                     // 下限: 人口変化のみ
  M: (y) => SC.L(y) * Math.pow(1 + TR.slopePre, Math.min(+y, TR.capYear) - 2024),          // 中間: コロナ前の伸び（2040年まで）
  H: (y) => SC.L(y) * Math.pow(1 + TR.slopeAll, +y - 2024),                                // 上限: コロナ後の伸び
};
const cityPop = (y, a) => (a ? DATA.city[yk(y)][a] : DATA.city[yk(y)].t);
const wDiff35 = (w) => (w.disp['2035'] / w.disp['2025'] - 1) * 100;
const wPopDiff35 = (w) => (popT(w, 2035) / popT(w, 2025) - 1) * 100;
const units = (w) => w.unitsPerWard;                   // 区の救急隊数（2024）
const overYear = (w) => { for (const y of YEARS) if (dispA(w, y) / units(w) >= 3000) return y; return null; };
const nonTrYear = (y) => 1 - SER.transport[yk(y)] / SER.dispatch[yk(y)];

/* 書式 */
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const man = (n, d = 1) => (n / 10000).toFixed(d) + '万';
const sgn = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d);

/* ══════════════════════════════════════════════════════════════
   Canvas2D ヘルパー
   ══════════════════════════════════════════════════════════════ */
const cv = document.getElementById('cv');
const g = cv.getContext('2d');
const DBG = { chips: 0, texts: [] };            // 検証用（はみ出し・チップ数）
const font = (size, weight = 600, num = false) => { g.font = `${weight} ${size}px ${num ? NUM : JP}`; };
function text(s, x, y, o = {}) {
  const a = (o.a ?? 1) * g.globalAlpha;
  if (a <= 0.003) return 0;
  g.save();
  g.globalAlpha = a;
  font(o.size || 24, o.w || 600, !!o.num);
  g.textAlign = o.align || 'left';
  g.textBaseline = o.base || 'alphabetic';
  if (o.ls) g.letterSpacing = o.ls + 'px';
  const tw = g.measureText(s).width;
  if (o.halo) { g.lineJoin = 'round'; g.lineWidth = o.halo; g.strokeStyle = o.haloC || '#fff'; g.strokeText(s, x, y); }
  g.fillStyle = o.c || COL.ink;
  g.fillText(s, x, y);
  g.restore();
  if (!o.noCheck && a > 0.05) {
    const tr = g.getTransform();
    const x0 = (o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x);
    const sz = o.size || 24;
    const yTop = o.base === 'middle' ? y - sz / 2 : o.base === 'top' ? y : y - sz * 0.85;
    DBG.texts.push([s, tr.a * x0 + tr.e, tr.d * yTop + tr.f, tr.a * (x0 + tw) + tr.e, tr.d * (yTop + sz) + tr.f]);
  }
  return tw;
}
const tw = (s, size, w = 600, num = false) => { g.save(); font(size, w, num); const r = g.measureText(s).width; g.restore(); return r; };
function rrect(x, y, w, h, r, fill, stroke, lw = 1) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function line(x1, y1, x2, y2, c, lw = 1, dash) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = c; g.lineWidth = lw;
  g.setLineDash(dash || []); g.stroke(); g.setLineDash([]);
}
function withAlpha(a, fn) { if (a <= 0.003) return; g.save(); g.globalAlpha *= a; fn(); g.restore(); }
function shadowed(fn, blur = 18, oy = 4, c = 'rgba(20,33,61,0.10)') { g.save(); g.shadowColor = c; g.shadowBlur = blur; g.shadowOffsetY = oy; fn(); g.restore(); }
// ポリライン（u: 0..1 で左から描く）
function polyline(pts, u, c, lw = 3, dash) {
  if (u <= 0 || pts.length < 2) return null;
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = L * clamp(u); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); let end = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (rem >= seg[i - 1]) { g.lineTo(pts[i][0], pts[i][1]); rem -= seg[i - 1]; end = pts[i]; }
    else { const k = rem / seg[i - 1]; end = [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; g.lineTo(end[0], end[1]); break; }
  }
  g.strokeStyle = c; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash(dash || []); g.stroke(); g.setLineDash([]);
  return end;
}
function dot(x, y, r, c, stroke) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = c; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); } }
function arrow(x1, y1, x2, y2, c, lw = 3, head = 12) {
  line(x1, y1, x2, y2, c, lw);
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - head * Math.cos(a - 0.45), y2 - head * Math.sin(a - 0.45));
  g.lineTo(x2 - head * Math.cos(a + 0.45), y2 - head * Math.sin(a + 0.45)); g.closePath(); g.fillStyle = c; g.fill();
}
// 注釈チップ: [t0,t1] で点灯（最大3つ）。白地・1px紺罫・角丸6px・意味色の点。入場は左→右のマスクワイプ
function chip(lt, t0, t1, s, x, y, o = {}) {
  if (lt < t0 || lt > t1) return;
  DBG.chips++;
  const size = 20, padX = 14, hgt = 40;
  const wAll = tw(s, size, 600) + padX * 2 + 16;
  const x0 = o.align === 'right' ? x - wAll : o.align === 'center' ? x - wAll / 2 : x;
  const u = E.outCubic(P(lt, t0, 0.45)), v = E.inOut(P(lt, t1 - 0.3, 0.3));
  clipRect(x0 - 2 + (wAll + 4) * v, y - 2, (wAll + 4) * (u - v), hgt + 4, () => {
    rrect(x0 + 0.5, y + 0.5, wAll - 1, hgt - 1, 6, '#ffffff', COL.navy, 1);
    dot(x0 + padX + 3, y + hgt / 2, 5, o.c || COL.navy);
    text(s, x0 + padX + 16, y + hgt / 2 + 1, { size, w: 600, base: 'middle', c: COL.ink });
  });
}
// マスク（矩形クリップ）。wipe(u) = 左→右に現れる
function clipRect(x, y, w, h, fn) { if (w <= 0 || h <= 0) return; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore(); }
function wipe(u, x, y, w, h, fn, v = 0) { if (u <= 0 || v >= 1) return; clipRect(x + w * v, y, w * (u - v), h, fn); }
// 桁を揃えた数字（tabular）。右端 or 左端に揃える
function numText(s, x, y, o = {}) {
  const size = o.size || 48, NW = Math.min(o.w || 600, 600); g.save(); font(size, NW, true);
  const dw = g.measureText('0').width; let total = 0;
  const ws = [...s].map((ch) => (/[0-9]/.test(ch) ? dw : g.measureText(ch).width)); ws.forEach((v) => { total += v; });
  g.restore();
  let cx = o.align === 'right' ? x - total : o.align === 'center' ? x - total / 2 : x;
  [...s].forEach((ch, i) => { text(ch, cx + (/[0-9]/.test(ch) ? (dw - tw(ch, size, NW, true)) / 2 : 0), y, { ...o, w: NW, align: 'left', num: true, size }); cx += ws[i]; });
  return total;
}
// 数字カウンター文字列
const counter = (lt, t0, v, d = 1.2) => fmt(v * cnt(lt, t0, d));

/* 軸（細い補助線） */
function hgrid(x0, x1, ys, labels, o = {}) {
  ys.forEach((y, i) => { line(x0, y, x1, y, COL.grid, 1); if (labels) text(labels[i], x0 - 12, y + 6, { size: 18, w: 500, num: true, c: COL.faint, align: 'right' }); });
}

/* ══════════════════════════════════════════════════════════════
   2D 地図（区のポリゴン）— サイトと同じ座標変換
   ══════════════════════════════════════════════════════════════ */
const K = 100, LON0 = 130.400, LAT0 = 33.590, CL = Math.cos(33.59 * Math.PI / 180);
const px = (lon, lat) => [(lon - LON0) * CL * K, -(lat - LAT0) * K];
const MAPB = (() => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; WD.forEach((w) => w.rings.flat().forEach((p) => { const [x, z] = px(p[0], p[1]); x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); })); return { x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 }; })();
function mapXf(box) {
  const s = Math.min(box.w / (MAPB.x1 - MAPB.x0), box.h / (MAPB.z1 - MAPB.z0));
  const ox = box.x + box.w / 2 - MAPB.cx * s, oy = box.y + box.h / 2 - MAPB.cz * s;
  return { s, f: (lon, lat) => { const [x, z] = px(lon, lat); return [ox + x * s, oy + z * s]; } };
}
function drawMap(box, fillFn, o = {}) {
  const xf = mapXf(box);
  WD.forEach((w, i) => {
    const a = o.alphaFn ? o.alphaFn(w, i) : 1;
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.beginPath();
    w.rings.forEach((r) => { r.forEach((p, j) => { const [x, y] = xf.f(p[0], p[1]); if (j) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); });
    g.fillStyle = fillFn(w, i); g.fill();
    g.strokeStyle = o.stroke || '#ffffff'; g.lineWidth = o.lw || 1.5; g.lineJoin = 'round'; g.stroke();
    g.restore();
  });
  return xf;
}
const wardC = (xf, w) => xf.f(w.c[0], w.c[1]);

/* ══════════════════════════════════════════════════════════════
   three.js — 3D 地図（平行投影・押し出し・影・エッジ）
   ══════════════════════════════════════════════════════════════ */
const glc = document.getElementById('gl');
const R = new THREE.WebGLRenderer({ canvas: glc, antialias: true, preserveDrawingBuffer: true, alpha: false });
R.setPixelRatio(1); R.setSize(W, H, false); R.setClearColor(0xf7f8fa, 1);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap; R.shadowMap.autoUpdate = true;
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
const hemi = new THREE.HemisphereLight(0xffffff, 0xc9d3df, 2.2); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-20, 36, 16); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 120 });
key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
scene.add(key); scene.add(key.target);
const fillL = new THREE.DirectionalLight(0xdfe8f5, 0.6); fillL.position.set(24, 12, -18); scene.add(fillL);
// 床: 淡い面（ライトの影響を受けない）＋影だけを受ける面＋薄いグリッド
const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: 0xf7f8fa }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.04; scene.add(floor);
const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ color: 0x14213d, opacity: 0.10 }));
shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.position.y = -0.03; shadowFloor.receiveShadow = true; scene.add(shadowFloor);
const grid = new THREE.GridHelper(160, 32, 0xe6eaf0, 0xe6eaf0); grid.position.y = -0.02; scene.add(grid);

const meshes = [], lows = [], outlines = [];
WD.forEach((w, i) => {
  // 福岡は島（志賀島・能古島など）があるので rings は全部が外周。1区＝複数シェイプで押し出す
  const shapes = w.rings.map((r) => { const sh = new THREE.Shape(); r.forEach((p, j) => { const [x, z] = px(p[0], p[1]); if (j === 0) sh.moveTo(x, -z); else sh.lineTo(x, -z); }); return sh; });
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 1, bevelEnabled: false, steps: 1 }); geo.rotateX(-Math.PI / 2);
  const edgeGeo = new THREE.EdgesGeometry(geo, 20);
  const mk = (color) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, transparent: true, opacity: 1 }));
    m.castShadow = true; m.receiveShadow = true;
    const ln = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x14213d, transparent: true, opacity: 0.3 }));
    m.add(ln); m.userData.line = ln; scene.add(m); return m;
  };
  meshes.push(mk(0x7fa6d6));
  lows.push(mk(0xf4a259));
  // 輪郭線（第0章の線描き用）
  // outlines[i] = 主な外周（rings[0]）の Line。島の外周は子の Line（userData.extra）。走らせるのは outlineU(i,u) で
  const mkLine = (r) => {
    const pts = r.map((p) => { const [x, z] = px(p[0], p[1]); return new THREE.Vector3(x, 0.03, z); });
    pts.push(pts[0].clone());
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x14213d, transparent: true, opacity: 0.85 }));
    l.userData.n = pts.length; return l;
  };
  const ol = mkLine(w.rings[0]); ol.userData.extra = w.rings.slice(1).map((r) => { const l = mkLine(r); ol.add(l); return l; });
  scene.add(ol); outlines.push(ol);
});
const C3 = WD.map((w) => px(w.c[0], w.c[1]));   // 区の重心 [x,z]
const hOf = (v) => 0.4 + (v / 23000) * 7;          // 出場件数 → 柱の高さ（最大 博多 22,046 で約7.1）
const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
function setColorHSL(mat, a, b, u) { tmpC.set(a); tmpC2.set(b); tmpC.lerpHSL(tmpC2, clamp(u)); mat.color.copy(tmpC); }
// すべての3D要素を既定状態に（各フレームでチャプターが上書き）
function reset3D() {
  meshes.forEach((m) => { m.visible = false; m.position.y = 0; m.scale.y = 1; m.material.opacity = 1; m.userData.line.material.opacity = 0.3; });
  lows.forEach((m) => { m.visible = false; m.position.y = 0; m.scale.y = 1; m.material.opacity = 1; m.userData.line.material.opacity = 0.3; });
  outlines.forEach((o) => { o.visible = false; o.material.opacity = 0.85; o.userData.extra.forEach((l) => { l.material.opacity = 0.85; }); });
}
// 輪郭線を u(0..1) まで走らせる（島の外周も同じ割合で）。op=線の濃さ
function outlineU(i, u, op = 0.9) {
  const ol = outlines[i];
  ol.visible = u > 0;
  [ol, ...ol.userData.extra].forEach((l) => { l.geometry.setDrawRange(0, Math.max(2, Math.ceil(l.userData.n * clamp(u)))); l.material.opacity = op; });
}
function setPillar(i, h, color, op = 1) {
  const m = meshes[i];
  m.visible = h > 0.002; m.scale.y = Math.max(0.002, h); m.material.color.set(color);
  m.material.opacity = op; m.material.depthWrite = op > 0.99; m.castShadow = op > 0.5; m.userData.line.material.opacity = 0.3 * op;
}
// カメラ: {theta,phi,dist,tx,tz}
let camState = null, camVP = { x: 0, w: W };
function setCam(s, vx = 0, vw = W) {
  const a = vw / H, sz = s.dist * 0.5;
  cam.left = -sz * a; cam.right = sz * a; cam.top = sz; cam.bottom = -sz; cam.updateProjectionMatrix();
  const D = 80;
  cam.position.set(s.tx + D * Math.sin(s.phi) * Math.sin(s.theta), D * Math.cos(s.phi), s.tz + D * Math.sin(s.phi) * Math.cos(s.theta));
  cam.lookAt(s.tx, 0.5, s.tz); cam.updateMatrixWorld();
  camState = s; camVP = { x: vx, w: vw };
}
const lerpCam = (a, b, u) => ({ theta: lerp(a.theta, b.theta, u), phi: lerp(a.phi, b.phi, u), dist: lerp(a.dist, b.dist, u), tx: lerp(a.tx, b.tx, u), tz: lerp(a.tz, b.tz, u) });
// 1ビューを描く（分割画面はシザーで2回）
function beginGL() { R.setScissorTest(false); R.setViewport(0, 0, W, H); R.clear(); }
function renderView(vx, vw, sx = vx, sw = vw) {
  if (sw <= 0.5) return;
  R.setScissorTest(true); R.setViewport(vx, 0, vw, H); R.setScissor(Math.round(sx), 0, Math.round(sw), H);
  R.render(scene, cam);
}
// 画面上で地図を右へ dx（ワールド単位）ずらす
const shiftCam = (s, dx) => ({ ...s, tx: s.tx - dx * Math.cos(s.theta), tz: s.tz + dx * Math.sin(s.theta) });
const meanC = (names) => { const a = names.map((n) => C3[WI[n]]); return [a.reduce((p, c) => p + c[0], 0) / a.length, a.reduce((p, c) => p + c[1], 0) / a.length]; };
const _v = new THREE.Vector3();
function proj(x, y, z) { _v.set(x, y, z).project(cam); return [camVP.x + (_v.x + 1) / 2 * camVP.w, (1 - _v.y) / 2 * H]; }
let glShown = false;
function show3D(on) { if (on !== glShown) { glc.style.display = on ? 'block' : 'none'; glShown = on; } }
const CAM0 = { theta: -0.35, phi: 0.95, dist: 29, tx: -2.8, tz: -2.7 };   // 福岡7区が1920×1080に余白つきで収まる角度
const ORDER_X = WD.map((w, i) => i).sort((a, b) => C3[a][0] - C3[b][0]);  // 西→東
const rankX = []; ORDER_X.forEach((i, k) => { rankX[i] = k; });

/* ══════════════════════════════════════════════════════════════
   ロゴ（タイトルのロックアップ）と、中区からの同心円順
   ══════════════════════════════════════════════════════════════ */
// 描く順: 中央区 → 博多区 → 中央区からの距離順（同心円状）
const CHUO = C3[WI['中央']];
const DIST_N = WD.map((w, i) => Math.hypot(C3[i][0] - CHUO[0], C3[i][1] - CHUO[1]));
const keyN = (i) => (WD[i].name === '中央' ? -2 : WD[i].name === '博多' ? -1 : DIST_N[i]);
const ORDER_N = WD.map((w, i) => i).sort((a, b) => keyN(a) - keyN(b));
const rankN = []; ORDER_N.forEach((i, k) => { rankN[i] = k; });
const DMAX = Math.max(...DIST_N);
// タイトルのロックアップ（ロゴ）。lt0=出現開始からの経過秒。x,y=タイトルのベースライン左端
const LOGO = '救急需要の未来地図', LOGO_CITY = '福岡市';
// o: 時刻割り（秒）。既定は第10章末尾用。第0章は {sub:2.6, dSub:0.8, title:2.6, rule:3.4}
function drawLockup(u, x, y, o = {}) {
  // u: 出現開始からの秒（大きければ完成形）
  const T = { sub: 0, dSub: 0.6, title: 0.2, dTitle: 1.0, rule: 1.1, dRule: 1.2, ...o };
  const ts = 120, lsp = -0.02 * ts;
  g.save(); g.letterSpacing = lsp + 'px'; font(ts, 800); const wT = g.measureText(LOGO).width; g.restore();
  // 上の小見出し「福岡市 2025 → 2035」（マスクワイプ）
  wipe(E.outCubic(P(u, T.sub, T.dSub)), x, y - ts - 70, 700, 50, () => {
    const a = text(LOGO_CITY, x, y - ts - 34, { size: 28, w: 600 });
    numText('2025', x + a + 18, y - ts - 34, { size: 28, w: 600 });
    text('→', x + a + 96, y - ts - 36, { size: 28, w: 600, num: true, c: COL.sub });
    numText('2035', x + a + 136, y - ts - 34, { size: 28, w: 600 });
  });
  // タイトル本体（左→右のマスクワイプ）
  wipe(E.outCubic(P(u, T.title, T.dTitle)), x, y - ts - 10, wT + 40, ts + 50, () => text(LOGO, x, y, { size: ts, w: 800, ls: lsp }));
  // ルールが左から伸び、先端を赤い正方形が走って右端で止まる
  const r = E.outCubic(P(u, T.rule, T.dRule));
  if (r > 0) {
    const ry = y + 44;
    line(x, ry, x + wT * r, ry, COL.navy, 2);
    g.fillStyle = COL.red; g.fillRect(x + wT * r + 6, ry - 7, 14, 14);
  }
  return wT;
}


/* ── レイアウト共通: 文字は左カラム(80–760)、グラフは右(800–1840) ── */
const LX = M, LW = 680, RX0 = 800, RX1 = W - M;
// マスクワイプで出入りする文字（複数行は \n）
function wtext(lt, tIn, tOut, s, x, y, o = {}) {
  if (lt < tIn || (tOut != null && lt > tOut + 0.36)) return;
  const size = o.size || 28, w8 = o.w || (size >= 48 ? 800 : 600), lead = o.lead || Math.round(size * 1.5);
  const lines = String(s).split('\n');
  const wMax = Math.max(...lines.map((l) => tw(l, size, w8, !!o.tab)));
  const u = E.outCubic(P(lt, tIn, o.d || 0.5)), v = tOut == null ? 0 : E.inOut(P(lt, tOut, 0.35));
  const xL = o.align === 'right' ? x - wMax : o.align === 'center' ? x - wMax / 2 : x;
  wipe(u, xL - 6, y - size * 1.1, wMax + 16, lead * (lines.length - 1) + size * 1.45, () => lines.forEach((l, i) => {
    if (o.tab) numText(l, x, y + i * lead, { ...o, size, w: w8 }); else text(l, x, y + i * lead, { ...o, size, w: w8 });
  }), v);
}
// 線が走る罫線
function rule(lt, tIn, x, y, w, c = COL.navy, lw = 1, d = 0.6) { const u = E.outCubic(P(lt, tIn, d)); if (u > 0) line(x, y, x + w * u, y, c, lw); }
// 区間の外ではスキップし、終わりは左→右に消える（ワイプアウト）
function phase(lt, a, b, fn, box = [0, 130, W, 800]) {
  if (lt < a || lt > b + 0.4) return;
  const v = E.inOut(P(lt, b, 0.4));
  if (v <= 0) fn(); else clipRect(box[0] + box[2] * v, box[1], box[2] * (1 - v), box[3], fn);
}


/* ══════════════════════════════════════════════════════════════
   3D ラベル・色・統計・その他
   ══════════════════════════════════════════════════════════════ */
const divCol = (v) => rampDiv(v, 15, -5);
const fadeCol = (c, k) => mix(c, '#f1f3f6', k);
const pctRange = (arr) => { const a = arr.map((v) => Math.abs(v)); return [Math.min(...a), Math.max(...a)]; };
const wn = (w) => { const n = typeof w === 'string' ? w : w.name; return n.endsWith('区') ? n : n + '区'; };   // 区名は常に「◯◯区」
function wardLabel3D(i, h, l1, l2, c2 = COL.ink, a = 1, left = false) {
  if (typeof l1 === 'string' && l1.length <= 5 && WI[l1] !== undefined) l1 = l1 + '区';
  const [x, z] = C3[i]; const [sx, sy] = proj(x, h + 0.2, z);
  withAlpha(a, () => {
    line(sx, sy, sx, sy - 34, COL.navy, 1);
    const wl = tw(l1, 28, 800) + 8 + (l2 ? tw(l2, 28, 600, true) : 0), bx = left ? sx - 8 - wl : sx + 8;
    const w1 = text(l1, bx, sy - 40, { size: 28, w: 800, halo: 6 });
    if (l2) numText(l2, bx + 8 + w1, sy - 40, { size: 28, c: c2, halo: 6 });
  });
}
const corr = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); };
const fit = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; } const b = sxy / sxx; return [my - b * mx, b]; };
const sgn2 = (v) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
function axes(lt, t0, C, xt, yt) {
  const u = E.outCubic(P(lt, t0, 0.6));
  line(C.x0, C.y1, lerp(C.x0, C.x1, u), C.y1, COL.navy, 1);
  line(C.x0, C.y1, C.x0, lerp(C.y1, C.y0, u), COL.navy, 1);
  xt.forEach(([v, s]) => wtext(lt, t0 + 0.2, null, s, C.X(v), C.y1 + 34, { size: 20, c: COL.sub, align: 'center' }));
  yt.forEach(([v, s]) => { if (u > 0) line(C.x0, C.Y(v), lerp(C.x0, C.x1, u), C.Y(v), COL.grid, 1); wtext(lt, t0 + 0.2, null, s, C.x0 - 14, C.Y(v) + 7, { size: 20, c: COL.sub, align: 'right' }); });
}
const bgWipe = (lt, t0, d = 0.8) => { const u = E.inOut(P(lt, t0, d)); clipRect(0, 0, W * u, H, () => { g.fillStyle = COL.bg; g.fillRect(0, 0, W, H); }); };
function drawConclAt(l, s) {
  clipRect(0, 0, W * E.outCubic(P(l, 0, 0.18)), H, () => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); });
  wipe(E.outCubic(P(l, 0.08, 0.35)), M, 440, 1760, 110, () => text(s, M, 520, { size: 48, w: 800 }));
  line(M, 560, M + tw(s, 48, 800) * E.outCubic(P(l, 0.2, 0.5)), 560, COL.navy, 2);
}
// URL は画面に出さない（依頼主の指示）。URL_TXT は廃止
