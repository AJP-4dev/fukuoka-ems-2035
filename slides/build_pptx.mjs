// 福岡市 救急需要の未来地図 2025→2035 職員向けスライド（21枚）
// 数値は src/*.json と data.js から読み込む（手入力で drift しないように）。
import pptxgen from "pptxgenjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dir, "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "src", f), "utf8"));
const MODEL = J("model.json"), TREND = J("trend.json"), NEN = J("nenpo_inputs.json"), STL = J("stations_load.json");
const D = new Function(fs.readFileSync(path.join(ROOT, "data.js"), "utf8") + ";return DATA;")();

// ---------- 数値の導出 ----------
const G = ["k", "j", "w", "e1", "e2", "e3"];
const GLABEL = { k: "0–6歳", j: "7–17歳", w: "18–64歳", e1: "65–74歳", e2: "75–84歳", e3: "85歳以上" };
const R = MODEL.rates;
const WARDS = D.wards; // 東・博多・中央・南・城南・早良・西
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const f1 = (n) => n.toFixed(1);
const sgn = (n, d = 1) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(d);
const cityDisp = (y) => WARDS.reduce((s, w) => s + w.disp[y], 0);
const cityPop = (y) => D.city[y].t;
const mult = (sc, y) => sc === "M" ? Math.pow(1 + TREND.slopePre, Math.min(y, TREND.capYear) - 2024)
  : sc === "H" ? Math.pow(1 + TREND.slopeAll, y - 2024) : 1;
const SER = NEN.series;
const YRS13 = Object.keys(SER.dispatch).map(Number);
const d24 = SER.dispatch[2024], t24 = SER.transport[2024];
const L35 = cityDisp(2035), M35 = Math.round(L35 * mult("M", 2035)), H35 = Math.round(L35 * mult("H", 2035));
const pct = (a, b) => (a / b - 1) * 100;
const c25 = D.city[2025], c35 = D.city[2035];
const e65 = (c) => c.e1 + c.e2 + c.e3;

// 外れ値検出用: アウトラインの確定値と突合（食い違いは警告表示）
const warn = [];
const expect = (name, got, want) => { if (String(got) !== String(want)) warn.push(`${name}: got ${got} want ${want}`); };
expect("2024出場", d24, 100181); expect("搬送", t24, 87291);
expect("2025出場", cityDisp(2025), 100139); expect("2035下限", L35, 112124);
expect("中間", M35, 125165); expect("上限", H35, 138192);
expect("人口25", f1(cityPop(2025) / 1e4), "160.8"); expect("人口35", f1(cityPop(2035) / 1e4), "164.5");
expect("85+", f1(c25.e3 / 1e4) + "/" + f1(c35.e3 / 1e4), "6.1/9.3");
expect("2050下限", cityDisp(2050), 121804);

// 配色
const NAVY = "14213D", RED = "E63946", PURPLE = "8E3B8F", ORANGE = "F4A259", BLUE = "3A7BD5",
  SKY = "9AD0F5", LBLUE = "BFD7F2", GREEN = "1B998B", MUTED = "5B6B82", WARM = "ED747E", CARD = "F2F5FA", PALE = "F7C6CA";
const GCOL = { k: SKY, j: LBLUE, w: BLUE, e1: ORANGE, e2: WARM, e3: PURPLE };
const JP = "Hiragino Sans", NUM = "Avenir Next";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in (16:9)
pres.title = "福岡市 救急需要の未来地図 2025→2035（職員向け）";
pres.author = "本資料の再計算（市の公式見解ではない）";
const W = 13.333, MX = 0.5, CW = W - 2 * MX; // content width 12.333
const GAP = 0.3, TOP = 1.45, BOT = 6.55;

// ---------- ヘルパ ----------
function base(title, source, notes, opts = {}) {
  const s = pres.addSlide();
  const dark = !!opts.dark;
  s.background = { color: dark ? NAVY : "FFFFFF" };
  if (title) s.addText(title, { x: MX, y: 0.4, w: opts.titleW || CW, h: 0.8, margin: 0, fontFace: JP, fontSize: 32, bold: true, color: dark ? "FFFFFF" : NAVY, valign: "middle" });
  if (source) s.addText("出典：" + source, { x: MX, y: 6.7, w: CW, h: 0.3, margin: 0, fontFace: JP, fontSize: 10, color: MUTED, valign: "middle" });
  s.addNotes(notes);
  return s;
}
const txt = (s, t, o) => s.addText(t, { fontFace: JP, color: NAVY, margin: 0, valign: "top", align: "left", fontSize: 16, ...o });
const big = (s, t, o) => s.addText(t, { fontFace: NUM, color: RED, margin: 0, valign: "middle", align: "left", fontSize: 64, bold: true, ...o });
const card = (s, x, y, w, h, fill = CARD) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 }, rectRadius: 0.08 });
function tag(s, x, y, label = "推定") {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 0.8, h: 0.34, fill: { color: "FFFFFF" }, line: { color: RED, width: 1.5 }, rectRadius: 0.08 });
  s.addText(label, { x, y, w: 0.8, h: 0.34, margin: 0, fontFace: JP, fontSize: 14, bold: true, color: RED, align: "center", valign: "middle" });
}
const chartBase = (o = {}) => ({
  catAxisLabelFontFace: JP, valAxisLabelFontFace: JP, catAxisLabelFontSize: 12, valAxisLabelFontSize: 12,
  catAxisLabelColor: NAVY, valAxisLabelColor: MUTED, valGridLine: { color: "E2E8F0", size: 0.5 }, catGridLine: { style: "none" },
  legendFontFace: JP, legendFontSize: 12, legendColor: NAVY, dataLabelFontFace: JP, dataLabelFontSize: 12, dataLabelColor: NAVY, ...o,
});
// 区の輪郭を custGeom で描く
function drawRings(s, rings, box, fill, line, lw = 0.75) {
  const all = rings.flat(), lon = all.map(p => p[0]), lat = all.map(p => p[1]);
  return { lon, lat };
}
function mapBounds(wards) {
  const lon = [], lat = [];
  wards.forEach(w => w.rings.forEach(r => r.forEach(p => { lon.push(p[0]); lat.push(p[1]); })));
  return { x0: Math.min(...lon), x1: Math.max(...lon), y0: Math.min(...lat), y1: Math.max(...lat) };
}
function drawMap(s, box, fills, lineColor, lw, transparency = 0) {
  const b = mapBounds(WARDS), k = Math.cos(33.6 * Math.PI / 180);
  const mw = (b.x1 - b.x0) * k, mh = b.y1 - b.y0, sc = Math.min(box.w / mw, box.h / mh);
  const ox = box.x + (box.w - mw * sc) / 2, oy = box.y + (box.h - mh * sc) / 2;
  const P = (p) => ({ x: ox + (p[0] - b.x0) * k * sc, y: oy + (b.y1 - p[1]) * sc });
  WARDS.forEach((w, i) => {
    w.rings.forEach(r => {
      const pts = r.map(P), xs = pts.map(p => p.x), ys = pts.map(p => p.y);
      const x = Math.min(...xs), y = Math.min(...ys), ww = Math.max(...xs) - x, hh = Math.max(...ys) - y;
      if (ww < 0.01 || hh < 0.01) return;
      const pp = pts.map((p, j) => ({ x: p.x - x, y: p.y - y, ...(j === 0 ? { moveTo: true } : {}) }));
      pp.push({ close: true });
      s.addShape(pres.shapes.CUSTOM_GEOMETRY, { x, y, w: ww, h: hh, points: pp,
        fill: fills ? { color: fills[i], transparency } : { color: "FFFFFF", transparency: 100 }, line: { color: lineColor, width: lw } });
    });
  });
  // 区名ラベルは地図スライドで別途
  return { P, b };
}

// =============== 1 表紙 ===============
{
  const s = base(null, null,
    "今日は、福岡市の救急車が10年後に何回出動することになるのかを、公開されている資料から計算し直した結果をお話しします。専門的な統計の知識は要りません。これは公表資料の再計算であり、市の公式見解ではない点だけ最初にお断りしておきます。",
    { dark: true });
  drawMap(s, { x: 7.4, y: 0.7, w: 5.4, h: 5.9 }, null, "4A5C85", 1.25);
  txt(s, "10年後、救急車は何回出る？", { x: MX, y: 2.2, w: 6.8, h: 1.9, fontSize: 40, bold: true, color: "FFFFFF", valign: "top" });
  txt(s, "福岡市 救急需要の未来地図 2025→2035", { x: MX, y: 4.25, w: 6.8, h: 0.5, fontSize: 20, color: "BFD7F2" });
  txt(s, "作成 2026-10／公表資料の再計算・市の公式見解ではない", { x: MX, y: 6.6, w: 6.8, h: 0.4, fontSize: 14, color: "BFD7F2" });
}

// =============== 2 3つのこと ===============
{
  const s = base("この資料で分かる3つのこと", null,
    "この資料では、救急の出動が何件になるか、どの年代が増えるか、どこが先に忙しくなるかの3点をお伝えします。あわせて、その数字がどこから来ていて、どれくらい当てになるのかも最後にお話しします。10分ほどで一通りつかめる構成です。");
  const items = [["①", "何件になる？", "2035年の出場件数の見通し"], ["②", "誰が増える？", "運ばれる人の年代の変化"], ["③", "どこが先に詰まる？", "区・署所ごとの負担"]];
  const cw = (CW - 2 * GAP) / 3;
  items.forEach((it, i) => {
    const x = MX + i * (cw + GAP);
    card(s, x, TOP, cw, 3.4);
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: TOP + 0.3, w: 0.9, h: 0.9, fill: { color: NAVY }, line: { color: NAVY, width: 0 } });
    s.addText(it[0], { x: x + 0.3, y: TOP + 0.3, w: 0.9, h: 0.9, margin: 0, fontFace: JP, fontSize: 28, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, it[1], { x: x + 0.3, y: TOP + 1.5, w: cw - 0.6, h: 0.6, fontSize: 24, bold: true });
    txt(s, it[2], { x: x + 0.3, y: TOP + 2.2, w: cw - 0.6, h: 0.9, fontSize: 18 });
  });
  const y4 = TOP + 3.4 + GAP;
  card(s, MX, y4, CW, 0.8, "FFFFFF");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y: y4, w: CW, h: 0.8, fill: { color: "FFFFFF" }, line: { color: MUTED, width: 1 }, rectRadius: 0.08 });
  txt(s, "そして：その数字はどこから？ どれくらい確か？", { x: MX + 0.3, y: y4, w: CW - 0.6, h: 0.8, fontSize: 18, valign: "middle", color: MUTED });
}

// =============== 3 いま ===============
{
  const s = base("いま：1日274件、5分に1回", "福岡市消防年報 令和6年版",
    "2024年の救急出場は100,181件で、1日あたり約274件、およそ5分に1回出動している計算です。2013年と比べて1.47倍に増え、救急隊も27隊から34隊に増やしてきました。搬送された人は87,291人で、市民のおよそ19人に1人が利用しています。出場とは救急車が現場へ向かった回数のことです。");
  txt(s, `${SER.dispatch[2013].toLocaleString()}件 → ${fmt(d24)}件（2013→2024、${(d24 / SER.dispatch[2013]).toFixed(2)}倍）`, { x: MX, y: TOP, w: 6.6, h: 0.4, fontSize: 16, bold: true });
  s.addChart(pres.charts.BAR, [{ name: "出場件数", labels: YRS13.map(String), values: YRS13.map(y => SER.dispatch[y]) }],
    chartBase({ x: MX, y: TOP + 0.5, w: 6.6, h: 4.5, barDir: "col", chartColors: YRS13.map(y => y === 2024 ? RED : PALE), barGapWidthPct: 40, showLegend: false, valAxisMinVal: 0, valAxisLabelFormatCode: "#,##0", catAxisLabelFontSize: 11 }));
  const rx = 7.4, rw = W - MX - rx;
  txt(s, "2024年の出場件数", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18 });
  big(s, `${fmt(d24)}件`, { x: rx, y: TOP + 0.4, w: rw, h: 1.2, fontSize: 60 });
  txt(s, `搬送 ${fmt(t24)}人　市民19人に1人が利用`, { x: rx, y: TOP + 1.8, w: rw, h: 0.4, fontSize: 18 });
  txt(s, "救急隊の数（2013→2024）", { x: rx, y: TOP + 2.8, w: rw, h: 0.4, fontSize: 18 });
  big(s, `${SER.units[2013]} → ${SER.units[2024]}隊`, { x: rx, y: TOP + 3.2, w: rw, h: 1.2, fontSize: 60, color: NAVY });
}

// =============== 4 人口 vs 出場 ===============
{
  const ys = [...Array(11)].map((_, i) => 2025 + i);
  const s = base("人口は少し増えるだけ。出場はもっと増える", "福岡市の将来人口推計（令和6年4月）、本資料の推計（下限シナリオ）",
    "2025年を100とすると、2035年の人口は約102、出場件数は約112になります。人口は2.3%しか増えないのに、救急の出場は12.0%増える見通しです。なぜ差が出るのかというと、答えは年齢にあります。");
  s.addChart(pres.charts.LINE, [
    { name: "人口（2025=100）", labels: ys.map(String), values: ys.map(y => +(cityPop(y) / cityPop(2025) * 100).toFixed(1)) },
    { name: "出場件数（2025=100）", labels: ys.map(String), values: ys.map(y => +(cityDisp(y) / cityDisp(2025) * 100).toFixed(1)) }],
    chartBase({ x: MX, y: TOP, w: 7.8, h: 4.4, chartColors: [NAVY, RED], lineSize: 3, lineDataSymbolSize: 7, showLegend: true, legendPos: "b", valAxisMinVal: 95, valAxisMaxVal: 115, valAxisMajorUnit: 5 }));
  const rx = 8.6, rw = W - MX - rx;
  txt(s, "人口　2025→2035", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18, color: NAVY, bold: true });
  big(s, `${sgn(pct(cityPop(2035), cityPop(2025)))}%`, { x: rx, y: TOP + 0.4, w: rw, h: 1.1, color: NAVY });
  txt(s, `${f1(cityPop(2025) / 1e4)}万人 → ${f1(cityPop(2035) / 1e4)}万人`, { x: rx, y: TOP + 1.55, w: rw, h: 0.4, fontSize: 18 });
  txt(s, "出場件数　2025→2035", { x: rx, y: TOP + 2.3, w: rw, h: 0.4, fontSize: 18, bold: true });
  big(s, `${sgn(pct(cityDisp(2035), cityDisp(2025)))}%`, { x: rx, y: TOP + 2.7, w: rw, h: 1.1 });
  txt(s, `${fmt(cityDisp(2025))}件 → ${fmt(cityDisp(2035))}件`, { x: rx, y: TOP + 3.85, w: rw, h: 0.4, fontSize: 18 });
  txt(s, "なぜ差が出る？ → 答えは年齢", { x: MX, y: TOP + 4.6, w: CW, h: 0.5, fontSize: 24, bold: true });
}

// =============== 5 年齢別 搬送率 ===============
{
  const s = base("答えの核心：年を取るほど運ばれやすい", "福岡市消防年報 R6（年齢区分別搬送人員）、福岡市 登録人口、消防庁 救急・救助の現況（高齢者内の内訳）",
    "グラフは、1年間に100人のうち何人が救急車で運ばれるかを年齢帯ごとに示しています。搬送率というのは、1年に救急車で運ばれる人の割合のことです。85歳以上では約3.4人に1人が運ばれ、これは18歳から64歳の約9.5倍にあたります。");
  s.addChart(pres.charts.BAR, [{ name: "100人あたり/年", labels: G.map(g => GLABEL[g]), values: G.map(g => +(R[g] * 100).toFixed(1)) }],
    chartBase({ x: MX, y: TOP, w: 8.0, h: 4.9, barDir: "col", chartColors: G.map(g => GCOL[g]), barGapWidthPct: 30, showLegend: false, showValue: true, dataLabelFormatCode: "0.0", dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelPosition: "outEnd",
      valAxisMinVal: 0, valAxisMaxVal: 35, showValAxisTitle: true, valAxisTitle: "100人あたり/年（搬送人員）", valAxisTitleFontSize: 12, valAxisTitleFontFace: JP, valAxisTitleColor: MUTED, catAxisLabelFontSize: 14 }));
  const rx = 8.8, rw = W - MX - rx;
  txt(s, "85歳以上", { x: rx, y: TOP + 0.2, w: rw, h: 0.4, fontSize: 18, bold: true, color: PURPLE });
  big(s, `${f1(1 / R.e3)}人に1人`, { x: rx, y: TOP + 0.6, w: rw, h: 1.0, fontSize: 48, color: PURPLE });
  txt(s, "が1年に救急車で運ばれる", { x: rx, y: TOP + 1.65, w: rw, h: 0.4, fontSize: 18 });
  txt(s, "18–64歳の", { x: rx, y: TOP + 2.8, w: rw, h: 0.4, fontSize: 18, bold: true });
  big(s, `${f1(R.e3 / R.w)}倍`, { x: rx, y: TOP + 3.2, w: rw, h: 1.0, fontSize: 60, color: NAVY });
}

// =============== 6 85歳以上が1.5倍 ===============
{
  const s = base("85歳以上が1.5倍になる", "福岡市の将来人口推計",
    "2025年から2035年にかけて、人口の全体はほとんど変わりませんが、85歳以上だけが6.1万人から9.3万人へ約1.5倍になります。65歳以上でみると35.9万人から41.2万人で、人口に占める割合は22.3%から25.0%です。増える出場は約12,000件で、これは65歳以上の増加分(約12,300件)でほぼ説明がつき、65歳未満はむしろ減ります。");
  const mk = (g) => ({ name: GLABEL[g], labels: ["2025", "2035"], values: [+(c25[g] / 1e4).toFixed(1), +(c35[g] / 1e4).toFixed(1)] });
  s.addChart(pres.charts.BAR, G.map(mk), chartBase({ x: MX, y: TOP, w: CW, h: 2.9, barDir: "bar", barGrouping: "stacked", chartColors: G.map(g => GCOL[g]), catAxisOrientation: "maxMin", showLegend: true, legendPos: "b", valAxisMinVal: 0, valAxisMaxVal: 180, valAxisMajorUnit: 20, showValAxisTitle: true, valAxisTitle: "人口（万人）", valAxisTitleFontSize: 12, valAxisTitleFontFace: JP, valAxisTitleColor: MUTED, catAxisLabelFontSize: 14, barGapWidthPct: 40 }));
  // 増加分に占める65歳以上
  const dTot = cityDisp(2035) - cityDisp(2025);
  const dE = WARDS.reduce((s2, w) => s2 + ["e1", "e2", "e3"].reduce((a, g) => a + w.byAge[2035][g] - w.byAge[2025][g], 0), 0);
  const cw = (CW - 2 * GAP) / 3, y = TOP + 2.9 + GAP, h = 1.95;
  const boxes = [
    ["85歳以上", `${f1(c25.e3 / 1e4)}→${f1(c35.e3 / 1e4)}万`, `×${(c35.e3 / c25.e3).toFixed(2)}`, PURPLE],
    ["65歳以上", `${f1(e65(c25) / 1e4)}→${f1(e65(c35) / 1e4)}万`, `${f1(e65(c25) / c25.t * 100)}% → ${f1(e65(c35) / c35.t * 100)}%`, NAVY],
    ["増える出場（2025→2035）", `+${fmt(dE)}件`, `65歳以上のぶん（全体の増加は +${fmt(dTot)}件）`, RED]];
  boxes.forEach((b, i) => {
    const x = MX + i * (cw + GAP);
    card(s, x, y, cw, h);
    txt(s, b[0], { x: x + 0.25, y: y + 0.15, w: cw - 0.5, h: 0.35, fontSize: 16, bold: true });
    s.addText(b[1], { x: x + 0.25, y: y + 0.55, w: cw - 0.5, h: 0.8, margin: 0, fontFace: NUM, fontSize: 36, bold: true, color: b[3], valign: "middle" });
    txt(s, b[2], { x: x + 0.25, y: y + 1.4, w: cw - 0.5, h: 0.55, fontSize: 16 });
  });
  warn.push(`[info] 65歳以上が占める増加分 ${(dE / dTot * 100).toFixed(1)}% (増加${dTot}件, うち65+ ${dE}件)`);
}

// =============== 7 データの出どころ ===============
{
  const s = base("データの出どころ：全部、公開資料", null,
    "使ったデータはすべて公開されている資料です。未来の人口は市の将来人口推計、いまの出場件数や年齢別の搬送は消防年報、昼間の人口は国勢調査から取っています。ご自身で確かめられるように、URLはサイトの方法タブに載せています。");
  const rows = [
    ["①", "福岡市の将来人口推計（令和6年4月）", "福岡市・令和6年", "未来の人口"],
    ["②", "福岡市消防年報 令和3〜6年版", "福岡市消防局・令和3〜6年", "区別出場・年齢・隊"],
    ["③", "福岡市 登録人口（2013〜24年）", "福岡市・2024年12月末", "いまの人口"],
    ["④", "令和2年国勢調査", "総務省統計局・令和2年", "昼間人口・1kmメッシュ人口"],
    ["⑤", "消防庁 救急・救助の現況（令和7年版）", "消防庁・令和7年", "全国の高齢者内訳"],
    ["⑥", "社人研 令和5年推計", "国立社会保障・人口問題研究所", "2035年以降の区別年齢"],
    ["⑦", "面積調・国土数値情報", "国土地理院・国土交通省", "面積・区界"]];
  const rh = 0.6, rg = 0.1;
  rows.forEach((r, i) => {
    const y = TOP - 0.05 + i * (rh + rg);
    card(s, MX, y, CW, rh);
    s.addText(r[0], { x: MX + 0.2, y, w: 0.5, h: rh, margin: 0, fontFace: JP, fontSize: 20, bold: true, color: BLUE, valign: "middle" });
    txt(s, r[1], { x: MX + 0.8, y, w: 4.9, h: rh, fontSize: 16, bold: true, valign: "middle" });
    txt(s, r[2], { x: MX + 5.8, y, w: 3.4, h: rh, fontSize: 16, valign: "middle", color: MUTED });
    txt(s, r[3], { x: MX + 9.3, y, w: 2.9, h: rh, fontSize: 16, valign: "middle" });
  });
  txt(s, "URLはサイトの方法タブに", { x: MX, y: TOP - 0.05 + 7 * (rh + rg) + 0.05, w: CW, h: 0.4, fontSize: 18, bold: true });
}

// =============== 8 5ステップ ===============
{
  const s = base("計算のしくみ：5ステップ", "本資料の推計モデル",
    "計算は5つのステップです。まず区と年齢ごとの人口を用意し、市の推計で未来の人口に置き換えます。次に、年齢ごとの運ばれる割合を掛け、昼に区外から来る人のぶんを足します。最後に実際の件数に合うよう倍率で合わせます。この倍率が校正係数で、人口から計算した件数と実際の件数の差を埋めるものです。");
  const steps = [
    ["いまの人口", "（区×年齢）", "出発点は公表されている実際の人口"],
    ["市の推計で", "未来の人口に", "人口は市の公式推計に合わせる"],
    ["年齢ごとの「運ばれる割合」を掛ける", "", "85歳以上は18–64歳の約" + f1(R.e3 / R.w) + "倍運ばれるから"],
    ["昼に来る人のぶんを足す", "（昼間補正）", "住んでいない人も倒れるから"],
    ["実際の件数に合わせる倍率", "（校正係数）", "病院・繁華街など人口で見えない事情をまとめて1つの倍率に"],
    ["出場件数", "", "→ 区ごと・年ごとの見通し"]];
  const n = 6, gap = 0.3, bw = (CW - (n - 1) * gap) / n, by = TOP + 0.1, bh = 2.0;
  steps.forEach((st, i) => {
    const x = MX + i * (bw + gap), last = i === n - 1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: by, w: bw, h: bh, fill: { color: last ? RED : NAVY }, line: { color: last ? RED : NAVY, width: 0 }, rectRadius: 0.08 });
    if (!last) s.addText(String(i + 1), { x: x + 0.12, y: by + 0.1, w: 0.4, h: 0.4, margin: 0, fontFace: NUM, fontSize: 20, bold: true, color: ORANGE, valign: "middle" });
    s.addText([{ text: st[0], options: { bold: true, breakLine: !!st[1] } }, ...(st[1] ? [{ text: st[1], options: { fontSize: 14 } }] : [])],
      { x: x + 0.12, y: by + (last ? 0 : 0.5), w: bw - 0.24, h: last ? bh : bh - 0.6, margin: 0, fontFace: JP, fontSize: last ? 20 : 16, color: "FFFFFF", valign: last ? "middle" : "top", align: "left" });
    if (!last) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + bw + 0.03, y: by + bh / 2 - 0.12, w: gap - 0.06, h: 0.24, fill: { color: MUTED }, line: { color: MUTED, width: 0 } });
    if (last) txt(s, st[2], { x, y: by + bh + 0.3, w: bw, h: 1.0, fontSize: 16, bold: true });
    else {
      txt(s, "なぜ？", { x, y: by + bh + 0.3, w: bw, h: 0.3, fontSize: 14, bold: true, color: GREEN });
      txt(s, st[2], { x, y: by + bh + 0.65, w: bw, h: 1.9, fontSize: 16 });
    }
  });
}

// =============== 9 東区の実例 ===============
{
  const E = WARDS[0];
  const dx = Math.round(0.35 * (E.in - E.out) * R.w); // 昼間補正（搬送人員）
  const sum = (y) => G.reduce((a, g) => a + E.pop[y][g] * R[g], 0);
  const s25 = sum(2025), s35 = sum(2035);
  const s = base("実例：東区でやってみる", "本資料の推計モデル（方法タブの実例と同じ数字）",
    "東区を例に計算の流れを見てみます。年齢ごとの人口に運ばれる割合を掛けて搬送人員を出し、昼間補正を足して、出場と搬送の比と校正係数を掛けると出場件数になります。2025年の18,131件が2035年には20,409件で、12.6%増えます。増えるぶんの中心は85歳以上です。");
  const H = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: NAVY }, align: "left", fontFace: JP, fontSize: 14 } });
  const c = (t, o = {}) => ({ text: t, options: { fontFace: JP, fontSize: 14, color: NAVY, align: "left", ...o } });
  const rows = [[H("年齢帯"), H("割合"), H("2025年 人口→搬送人員"), H("2035年 人口→搬送人員")]];
  G.forEach(g => rows.push([c(GLABEL[g], g === "e3" ? { bold: true, color: PURPLE } : {}), c((R[g]).toFixed(3)),
    c(`${fmt(E.pop[2025][g])} → ${fmt(E.pop[2025][g] * R[g])}`, g === "e3" ? { bold: true, color: PURPLE } : {}),
    c(`${fmt(E.pop[2035][g])} → ${fmt(E.pop[2035][g] * R[g])}`, g === "e3" ? { bold: true, color: PURPLE } : {})]));
  rows.push([c("搬送人員の合計", { bold: true }), c(""), c(fmt(s25), { bold: true }), c(fmt(s35), { bold: true })]);
  rows.push([c("昼間補正"), c(""), c(String(dx).replace("-", "−")), c(String(dx).replace("-", "−"))]);
  rows.push([c(`×出場/搬送比 ${MODEL.dispRatio.toFixed(3)}`), c(""), c(""), c("")]);
  rows.push([c(`×校正係数 ${E.fac}`), c(""), c(""), c("")]);
  rows.push([c("出場件数", { bold: true, color: RED }), c(""), c(fmt(E.disp[2025]) + "件", { bold: true, color: RED }), c(fmt(E.disp[2035]) + "件", { bold: true, color: RED })]);
  s.addTable(rows, { x: MX, y: TOP - 0.05, w: 8.4, colW: [2.9, 0.9, 2.3, 2.3], rowH: 0.38, border: { type: "solid", pt: 0.5, color: "D5DCE8" }, valign: "middle", margin: [0, 0.08, 0, 0.08] });
  const rx = 9.3, rw = W - MX - rx;
  txt(s, "2035年の東区", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18, bold: true });
  big(s, `${sgn(pct(E.disp[2035], E.disp[2025]))}%`, { x: rx, y: TOP + 0.45, w: rw, h: 1.1 });
  const inc85 = E.pop[2035].e3 * R.e3 - E.pop[2025].e3 * R.e3, incAll = s35 - s25;
  txt(s, `増加分の中心は85歳以上\n（搬送人員の増加 ${fmt(incAll)}人のうち ${fmt(inc85)}人）`, { x: rx, y: TOP + 1.8, w: rw, h: 1.3, fontSize: 16, color: PURPLE, bold: true });
  warn.push(`[info] 東区 2025 合計=${fmt(s25)} 2035=${fmt(s35)} 昼間補正=${dx}、アウトライン記載(2035 18,918/20,187)とは不一致。JSON準拠。`);
}

// =============== 10 借りた値 ===============
{
  const s = base("借りた値と、その理由", "消防庁、総務省 人口推計、社人研",
    "福岡市の公表データだけでは足りない部分は、ほかの資料から値を借りています。高齢者の中の年齢比は全国値、昼間補正の係数は通勤・通学者が区内にいる時間の割合、2035年以降の区別の年齢内訳は社人研の構成比です。借りた値はすべてサイトの方法タブで公開しています。");
  const ratio = `1:${(R.e2 / R.e1).toFixed(1)}:${(R.e3 / R.e1).toFixed(1)}`;
  const items = [
    ["① 高齢者の中の比率", ratio, "65–74／75–84／85歳以上は全国値", "福岡の年報は65歳以上が一括だから"],
    ["② 昼間補正の係数", String(MODEL.dayf), "通勤・通学者が区内にいる時間（8.5時間/24時間）。横浜版と同じ", "昼に来る人のぶんを足すため"],
    ["③ 2035年以降の区別の年齢内訳", "社人研", "社人研の構成比を使う", "市の推計の区別表が2034年までだから"]];
  const cw = (CW - 2 * GAP) / 3, h = 4.1;
  items.forEach((it, i) => {
    const x = MX + i * (cw + GAP);
    card(s, x, TOP, cw, h);
    txt(s, it[0], { x: x + 0.25, y: TOP + 0.2, w: cw - 0.5, h: 0.7, fontSize: 18, bold: true });
    s.addText(it[1], { x: x + 0.25, y: TOP + 0.95, w: cw - 0.5, h: 0.9, margin: 0, fontFace: NUM, fontSize: 40, bold: true, color: BLUE, valign: "middle" });
    txt(s, it[2], { x: x + 0.25, y: TOP + 1.95, w: cw - 0.5, h: 1.0, fontSize: 16 });
    txt(s, "← " + it[3], { x: x + 0.25, y: TOP + 3.05, w: cw - 0.5, h: 0.9, fontSize: 16, bold: true, color: GREEN });
  });
  txt(s, "借りた値は方法タブで全部公開", { x: MX, y: TOP + h + GAP, w: CW, h: 0.45, fontSize: 18, bold: true });
}

// =============== 11 バックテスト ===============
{
  const ys = YRS13, adj = TREND.adjRate;
  const fy = TREND.fitYears || TREND.backtest.fitYears, fit = ys.filter(y => y >= fy[0] && y <= fy[1]);
  const ln = fit.map(y => Math.log(adj[y])), n = fit.length, mx = fit.reduce((a, b) => a + b) / n, my = ln.reduce((a, b) => a + b) / n;
  const b = fit.reduce((a, x, i) => a + (x - mx) * (ln[i] - my), 0) / fit.reduce((a, x) => a + (x - mx) ** 2, 0), a0 = my - b * mx;
  const pred = (y) => SER.dispatch[y] * Math.exp(a0 + b * y) / adj[y];
  const BT = TREND.backtest;
  warn.push(`[info] 予測線再計算 2022-24: ${[2022, 2023, 2024].map(y => fmt(pred(y)) + "/" + fmt(BT.pred[y])).join(" ")}`);
  const s = base("妥当性① 答え合わせ：過去で当ててみた", "福岡市消防年報、本資料の推計",
    "2013年から2019年のデータだけで傾きを引き、2022年から2024年の実績を当ててみました。結果は7%から9%ほど低く見積もる形になりました。コロナ後に利用が一段増えたためで、そこで上限シナリオを置いています。");
  s.addChart(pres.charts.LINE, [
    { name: "実績", labels: ys.map(String), values: ys.map(y => SER.dispatch[y]) },
    { name: "2013〜2019年の傾きで引いた予測線", labels: ys.map(String), values: ys.map(y => Math.round(pred(y))) }],
    chartBase({ x: MX, y: TOP, w: 8.0, h: 4.9, chartColors: [RED, NAVY], lineSize: 3, lineDataSymbolSize: 6, lineDash: ["solid", "dash"], showLegend: true, legendPos: "b", valAxisMinVal: 60000, valAxisMaxVal: 110000, valAxisLabelFormatCode: "#,##0" }));
  const rx = 8.8, rw = W - MX - rx;
  txt(s, "2022〜24年の差（予測−実績）", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18, bold: true });
  [2022, 2023, 2024].forEach((y, i) => {
    txt(s, `${y}年`, { x: rx, y: TOP + 0.6 + i * 0.95, w: 1.1, h: 0.8, fontSize: 18, valign: "middle" });
    s.addText(`${sgn(BT.errPct[y])}%`, { x: rx + 1.2, y: TOP + 0.6 + i * 0.95, w: rw - 1.2, h: 0.8, margin: 0, fontFace: NUM, fontSize: 40, bold: true, color: RED, valign: "middle" });
  });
  txt(s, "コロナ前の傾きだと、いまを7〜9%低く見積もる → だから“上限”シナリオを置いた", { x: rx, y: TOP + 3.6, w: rw, h: 1.3, fontSize: 16, bold: true });
}

// =============== 12 他都市比較 ===============
{
  const nat = ["e1", "e2", "e3"].map(g => NEN.national2024.transport[g] / NEN.national2024.pop[g] * 100);
  const yok = [6.3, 12.3, 24.8]; // 横浜市消防年報 R6（アウトライン記載値）
  const fk65 = (G.slice(3).reduce((a, g) => a + c25[g] * R[g], 0)) / e65(c25);
  const natAll = ["e1", "e2", "e3"].reduce((a, g) => a + NEN.national2024.transport[g], 0) / ["e1", "e2", "e3"].reduce((a, g) => a + NEN.national2024.pop[g], 0);
  warn.push(`[info] 全国 ${nat.map(v => v.toFixed(1))} /100人 (outline 5.9/12.0/24.9 は“1,000人あたり”表記だが実際は100人あたり)、福岡65+ ${(fk65 * 1000).toFixed(1)}/千 全国 ${(natAll * 1000).toFixed(1)}/千`);
  const s = base("妥当性② 他の都市と比べても同じ形", "消防庁 令和7年版、横浜市消防年報 R6",
    "全国と横浜市でも、年齢が上がるほど運ばれる割合が高くなる形は同じです。ただし水準そのものは地域で違い、福岡の65歳以上は全国より約15%高く出ています。そこで、形は他の都市の知見を借り、水準は福岡の実測値に合わせました。");
  s.addChart(pres.charts.BAR, [
    { name: "全国", labels: ["65–74歳", "75–84歳", "85歳以上"], values: nat.map(v => +v.toFixed(1)) },
    { name: "横浜", labels: ["65–74歳", "75–84歳", "85歳以上"], values: yok }],
    chartBase({ x: MX, y: TOP, w: 7.8, h: 4.9, barDir: "col", chartColors: [BLUE, ORANGE], barGapWidthPct: 50, showLegend: true, legendPos: "b", showValue: true, dataLabelFormatCode: "0.0", dataLabelFontSize: 14, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 30, showValAxisTitle: true, valAxisTitle: "人口100人あたり/年（搬送人員）", valAxisTitleFontSize: 12, valAxisTitleFontFace: JP, valAxisTitleColor: MUTED, catAxisLabelFontSize: 14 }));
  const rx = 8.6, rw = W - MX - rx;
  txt(s, "福岡の65歳以上全体", { x: rx, y: TOP + 0.2, w: rw, h: 0.4, fontSize: 18, bold: true });
  big(s, f1(fk65 * 100), { x: rx, y: TOP + 0.6, w: rw, h: 1.1, fontSize: 60 });
  txt(s, `人口100人あたり/年\n（全国 ${f1(natAll * 100)}。約${Math.round((fk65 / natAll - 1) * 100)}%高い）\n人口1,000人あたりでは ${f1(fk65 * 1000)}／${f1(natAll * 1000)}`, { x: rx, y: TOP + 1.8, w: rw, h: 1.5, fontSize: 16 });
  txt(s, "年を取るほど運ばれる“形”は地域によらず同じ。水準は福岡の実測に合わせた", { x: rx, y: TOP + 3.6, w: rw, h: 1.3, fontSize: 16, bold: true });
}

// =============== 13 校正のずれ ===============
{
  const names = WARDS.map(w => w.name + "区");
  const s = base("妥当性③ 計算値と実績のずれは 1.8%", "本資料の推計",
    "校正係数は、人口から計算した件数と実際の件数の差を埋める倍率です。市全体では、計算値は実績の1.018倍とほぼ一致しています。ただし博多区と中央区だけは係数が1.27、1.15と大きく、これは昼間に人が集まる都心だからで、次のスライドで詳しく見ます。");
  s.addChart(pres.charts.BAR, [
    { name: "校正前の計算値", labels: names, values: WARDS.map(w => Math.round(w.disp24 / w.fac)) },
    { name: "実績（2024年）", labels: names, values: WARDS.map(w => w.disp24) }],
    chartBase({ x: MX, y: TOP, w: 8.2, h: 4.9, barDir: "col", chartColors: [MUTED, RED], barGapWidthPct: 50, showLegend: true, legendPos: "b", valAxisMinVal: 0, valAxisLabelFormatCode: "#,##0" }));
  const rx = 9.0, rw = W - MX - rx;
  txt(s, "市全体の 計算値/実績", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18, bold: true });
  big(s, `${MODEL.preCalibRatio.toFixed(3)}倍`, { x: rx, y: TOP + 0.45, w: rw, h: 1.1, fontSize: 54 });
  const fk = (n) => WARDS.find(w => w.name === n).fac.toFixed(2);
  const others = WARDS.filter(w => !["博多", "中央"].includes(w.name)).map(w => w.fac);
  txt(s, "校正係数", { x: rx, y: TOP + 1.9, w: rw, h: 0.4, fontSize: 18, bold: true });
  txt(s, `博多 ${fk("博多")}\n中央 ${fk("中央")}\n他の5区 ${Math.min(...others).toFixed(2)}〜${Math.max(...others).toFixed(2)}`, { x: rx, y: TOP + 2.35, w: rw, h: 1.4, fontSize: 18 });
  txt(s, "都心だけ高い理由は昼間人口（次へ）", { x: rx, y: TOP + 3.9, w: rw, h: 0.9, fontSize: 16, bold: true });
}

// =============== 14 市全体 ===============
{
  const s = base("結果① 市全体：2035年は +12%〜+38%", "本資料の推計",
    "2035年の出場件数は、下限で112,124件、中間で125,165件、上限で138,192件と見込んでいます。下限は1人あたりの利用が今のままで、人口の変化だけを反映したものです。中間はコロナ前の伸びが続く場合、上限はコロナ後の伸びが続く場合です。");
  const cats = [`2024年 実績`, `2035 下限 ${sgn(pct(L35, d24))}%`, `2035 中間 ${sgn(pct(M35, d24))}%`, `2035 上限 ${sgn(pct(H35, d24))}%`];
  s.addChart(pres.charts.BAR, [{ name: "出場件数", labels: cats, values: [d24, L35, M35, H35] }],
    chartBase({ x: MX, y: TOP, w: CW, h: 2.9, barDir: "bar", chartColors: [NAVY, RED, RED, RED], catAxisOrientation: "maxMin", showLegend: false, showValue: true, dataLabelFormatCode: "#,##0", dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 160000, valAxisLabelFormatCode: "#,##0", catAxisLabelFontSize: 14, barGapWidthPct: 35 }));
  const cw = (CW - 2 * GAP) / 3, y = TOP + 2.9 + GAP, h = 1.85;
  [["下限", "1人あたりの利用は今のまま（人口の変化だけ）"], ["中間", `コロナ前の伸び（年${f1(TREND.slopePre * 100)}%）が${TREND.capYear}年まで続く`], ["上限", `コロナ後の伸び（年${f1(TREND.slopeAll * 100)}%）が続く`]].forEach((b, i) => {
    const x = MX + i * (cw + GAP);
    card(s, x, y, cw, h);
    txt(s, "シナリオ：" + b[0], { x: x + 0.25, y: y + 0.2, w: cw - 0.5, h: 0.4, fontSize: 18, bold: true, color: RED });
    txt(s, b[1], { x: x + 0.25, y: y + 0.7, w: cw - 0.5, h: 1.0, fontSize: 16 });
  });
}

const LBL_NUDGE = { 博多: [0.4, -0.25], 中央: [-0.4, 0.15], 南: [0.3, 0.12], 城南: [-0.45, -0.12] };
// =============== 15 7区 ===============
{
  const gr = WARDS.map(w => ({ n: w.name, v: pct(w.disp[2035], w.disp[2025]) })).sort((a, b) => b.v - a.v);
  const s = base("結果② 7区すべて +10〜15%", "本資料の推計（下限シナリオ、2025→2035）",
    "どの区でも出場は10%から15%増えます。一番増えるのは中央区の14.7%、一番少ないのは博多区の9.8%で、区ごとの差は小さいです。右の地図は増え方が大きいほど濃い赤にしています。");
  s.addChart(pres.charts.BAR, [{ name: "増加率（%）", labels: gr.map(g => g.n + "区"), values: gr.map(g => +g.v.toFixed(1)) }],
    chartBase({ x: MX, y: TOP, w: 7.4, h: 4.9, barDir: "bar", chartColors: [NAVY], catAxisOrientation: "maxMin", showLegend: false, showValue: true, dataLabelFormatCode: "+0.0;-0.0", dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 18, valAxisLabelFormatCode: "0", catAxisLabelFontSize: 16, barGapWidthPct: 40 }));
  const vals = WARDS.map(w => pct(w.disp[2035], w.disp[2025])), lo = Math.min(...vals), hi = Math.max(...vals);
  const mix = (t) => { const a = [0xF7, 0xC6, 0xCA], b2 = [0xE6, 0x39, 0x46]; return a.map((c, i) => Math.round(c + (b2[i] - c) * t).toString(16).padStart(2, "0")).join("").toUpperCase(); };
  const mb = { x: 8.2, y: TOP, w: W - MX - 8.2, h: 4.5 };
  const { P } = drawMap(s, mb, vals.map(v => mix((v - lo) / (hi - lo))), "FFFFFF", 1);
  WARDS.forEach((w, i) => {
    const p = P(w.c);
    const nd = LBL_NUDGE[w.name] || [0, 0];
    s.addText(`${w.name} ${sgn(vals[i])}%`, { x: p.x - 0.55 + nd[0], y: p.y - 0.15 + nd[1], w: 1.1, h: 0.3, margin: 0, fontFace: JP, fontSize: 12, bold: true, color: NAVY, align: "center", valign: "middle" });
  });
  txt(s, "どの区も増える。差は小さい", { x: 8.2, y: TOP + 4.6, w: mb.w, h: 0.4, fontSize: 16, bold: true });
}

// =============== 16 都心 ===============
{
  const per = WARDS.map(w => w.disp24 / (G.reduce((a, g) => a + w.pop[2025][g], 0)) * 1000);
  const s = base("結果③ 都心は“住んでいない人”が運ばれる", "令和2年国勢調査、本資料の推計",
    "住民1,000人あたりの出場は、博多区が82、中央区が75で、ほかの5区の55から57より目立って多くなっています。理由は昼間人口で、博多区は昼間の人口が夜間の1.59倍もいます。昼間補正とは、通勤・通学で昼に来る人のぶんを足すことで、博多区では約2,400件分にあたります。");
  s.addChart(pres.charts.BAR, [{ name: "住民1,000人あたり出場（件）", labels: WARDS.map(w => w.name + "区"), values: per.map(v => Math.round(v)) }],
    chartBase({ x: MX, y: TOP, w: 7.6, h: 4.9, barDir: "col", chartColors: WARDS.map(w => ["博多", "中央"].includes(w.name) ? RED : PALE), showLegend: false, showValue: true, dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 100, showValAxisTitle: true, valAxisTitle: "住民1,000人あたり出場（2024年・件）", valAxisTitleFontSize: 12, valAxisTitleFontFace: JP, valAxisTitleColor: MUTED, catAxisLabelFontSize: 14, barGapWidthPct: 40 }));
  const rx = 8.4, rw = W - MX - rx;
  txt(s, "昼夜間人口比（昼÷夜）", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18, bold: true });
  ["博多", "中央"].forEach((n, i) => {
    const w = WARDS.find(x => x.name === n), y = TOP + 0.5 + i * 1.6;
    txt(s, n + "区", { x: rx, y, w: 1.3, h: 1.1, fontSize: 20, bold: true, valign: "middle" });
    s.addText(w.dn.toFixed(2), { x: rx + 1.4, y, w: rw - 1.4, h: 1.1, margin: 0, fontFace: NUM, fontSize: 60, bold: true, color: NAVY, valign: "middle" });
  });
  const sg = (n) => (n >= 0 ? "+" : "−") + fmt(Math.abs(n));
  txt(s, `昼に来る人のぶん（昼間補正）\n博多 ${sg(WARDS[1].dayExtra)}件／中央 ${sg(WARDS[2].dayExtra)}件`, { x: rx, y: TOP + 3.8, w: rw, h: 1.1, fontSize: 18, bold: true });
}

// =============== 17 1隊あたり／基準隊数 ===============
{
  const lw = WARDS.map(w => ({ n: w.name, v: w.loadPerUnit24 })).sort((a, b) => b.v - a.v);
  const sumU = WARDS.reduce((a, w) => a + w.unitsPerWard, 0);
  const avg = 2968; // アウトライン記載の市平均（JSONからの単純計算 d24/隊数 とは異なる。READMEに注記）
  warn.push(`[info] 市平均 = ${d24}/${sumU} = ${avg} (outline 2,968)`);
  const st = MODEL.standard.units, cur = MODEL.standard.current;
  const s = base("結果④ 1隊あたりの負担と、基準の隊数", "福岡市消防年報 R6、消防力の整備指針 第13条（横浜市の算定例）",
    "左は区ごとの救急隊1隊あたりの出場件数で、南区が3,812件と最も多く、東区が2,590件と最も少なくなっています。右は国の整備指針に当てはめた基準の隊数で、今の34隊に対し、2025年で35隊、2035年で39隊になります。基準で見ると、すでに1隊足りず、2035年には5隊足りない計算です。");
  const lwid = 6.6;
  txt(s, `区別 1隊あたり出場（2024年実績、市平均 ${fmt(avg)}件）`, { x: MX, y: TOP, w: lwid, h: 0.4, fontSize: 16, bold: true });
  s.addChart(pres.charts.BAR, [{ name: "1隊あたり出場", labels: lw.map(l => l.n + "区"), values: lw.map(l => l.v) }],
    chartBase({ x: MX, y: TOP + 0.45, w: lwid, h: 4.55, barDir: "bar", chartColors: [RED], catAxisOrientation: "maxMin", showLegend: false, showValue: true, dataLabelFormatCode: "#,##0", dataLabelFontSize: 14, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 4800, valAxisLabelFormatCode: "#,##0", catAxisLabelFontSize: 14, barGapWidthPct: 35 }));
  const rx = MX + lwid + GAP, rw = W - MX - rx;
  txt(s, "整備指針の基準隊数", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 16, bold: true });
  s.addChart(pres.charts.BAR, [{ name: "隊数", labels: ["現行", "2025年", "2035年", "2050年"], values: [cur, st[2025], st[2035], st[2050]] }],
    chartBase({ x: rx, y: TOP + 0.45, w: rw, h: 3.0, barDir: "col", chartColors: [NAVY, RED, RED, RED], showLegend: false, showValue: true, dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 50, catAxisLabelFontSize: 14, barGapWidthPct: 40 }));
  txt(s, `基準では今すでに${st[2025] - cur}隊足りない計算。2035年には${st[2035] - cur}隊`, { x: rx, y: TOP + 3.65, w: rw, h: 1.2, fontSize: 18, bold: true });
}

// =============== 18 署所 ===============
{
  const act = STL.filter(x => x.units > 0 && x.perUnit && x.perUnit["2035"] != null);
  const top = [...act].sort((a, b) => b.perUnit["2035"] - a.perUnit["2035"]).slice(0, 6);
  const nm = (x) => x.name.replace(/出張所|消防署/g, "");
  const over25 = act.filter(x => x.perUnit["2025"] > 3000).length, over35 = act.filter(x => x.perUnit["2035"] > 3000).length;
  warn.push(`[info] 署所 ${act.length}, >3000: ${over25}→${over35}`);
  const s = base("結果⑤ 署所：先に詰まるのはここ", "令和2年国勢調査・経済センサス（メッシュ）、本資料の推定",
    "署所ごとの負担は推定です。1キロメートル四方の人口を最寄りの署所に割り振った目安で、公式の統計ではありません。2035年に1隊あたりの出場が最も多いのは堅粕の7,102件で、出張所に隊が1隊だけの署所に負担が集中する傾向があります。3,000件を超える署所は、26か所のうち13か所から15か所に増えます。",
    { titleW: CW - 1.4 });
  tag(s, W - MX - 0.8, 0.62);
  txt(s, "1隊あたり出場件数（2035年）", { x: MX, y: TOP, w: 7.4, h: 0.4, fontSize: 16, bold: true });
  s.addChart(pres.charts.BAR, [{ name: "1隊あたり出場（2035年・推定）", labels: top.map(nm), values: top.map(x => x.perUnit["2035"]) }],
    chartBase({ x: MX, y: TOP + 0.45, w: 7.4, h: 4.4, barDir: "bar", chartColors: [RED], catAxisOrientation: "maxMin", showLegend: false, showValue: true, dataLabelFormatCode: "#,##0", dataLabelFontSize: 16, dataLabelFontBold: true, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 9000, valAxisLabelFormatCode: "#,##0", catAxisLabelFontSize: 16, barGapWidthPct: 35 }));
  const rx = 8.5, rw = W - MX - rx;
  txt(s, "3,000件/隊を超える署所", { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18, bold: true });
  big(s, `${over25} → ${over35}`, { x: rx, y: TOP + 0.45, w: rw, h: 1.1 });
  txt(s, `（${act.length}署所中、2025→2035年）`, { x: rx, y: TOP + 1.6, w: rw, h: 0.4, fontSize: 16 });
  txt(s, "推定：1kmメッシュの人口を最寄りの署所に按分。公式の統計ではない。\n出張所1隊の署所に負担が集中する傾向。", { x: rx, y: TOP + 2.4, w: rw, h: 2.0, fontSize: 16, bold: true });
}

// =============== 19 2050 ===============
{
  const ys = [...Array(26)].map((_, i) => 2025 + i);
  const s = base("長期 2050：人口が減っても出場は減らない", "福岡市の将来人口推計、社人研、本資料の推計（下限シナリオ）",
    "2025年を100とすると、人口は2040年ごろにピークを迎えて、その後は減っていきます。それでも出場件数は下限シナリオで2050年に約12.2万件まで増え続けます。2040年以降に増えるのは75歳から84歳と85歳以上で、人口が減っても高齢者は増え続けるためです。");
  s.addChart(pres.charts.LINE, [
    { name: "人口（2025=100）", labels: ys.map(String), values: ys.map(y => +(cityPop(y) / cityPop(2025) * 100).toFixed(1)) },
    { name: "出場件数 下限（2025=100）", labels: ys.map(String), values: ys.map(y => +(cityDisp(y) / cityDisp(2025) * 100).toFixed(1)) }],
    chartBase({ x: MX, y: TOP, w: 8.2, h: 4.9, chartColors: [NAVY, RED], lineSize: 3, lineDataSymbolSize: 5, showLegend: true, legendPos: "b", valAxisMinVal: 95, valAxisMaxVal: 130, valAxisMajorUnit: 5, catAxisLabelFontSize: 11 }));
  const rx = 9.0, rw = W - MX - rx;
  const peak = ys.reduce((b, y) => cityPop(y) > cityPop(b) ? y : b, 2025);
  warn.push(`[info] 人口ピーク ${peak}年 ${cityPop(peak)}`);
  txt(s, `人口（${peak}年ピーク）`, { x: rx, y: TOP, w: rw, h: 0.4, fontSize: 18, bold: true });
  s.addText(`${f1(cityPop(peak) / 1e4)}→${f1(cityPop(2050) / 1e4)}万`, { x: rx, y: TOP + 0.45, w: rw, h: 0.8, margin: 0, fontFace: NUM, fontSize: 36, bold: true, color: NAVY, valign: "middle" });
  txt(s, "出場（下限、2050年）", { x: rx, y: TOP + 1.7, w: rw, h: 0.4, fontSize: 18, bold: true });
  big(s, `${fmt(cityDisp(2050))}件`, { x: rx, y: TOP + 2.15, w: rw, h: 1.0, fontSize: 54 });
  txt(s, `${peak}年以降に増えるのは 75〜84歳と85歳以上`, { x: rx, y: TOP + 3.5, w: rw, h: 1.2, fontSize: 16, bold: true });
}

// =============== 20 注意 ===============
{
  const s = base("使うときの注意", null,
    "この資料の数字を使うときの注意を5つ挙げます。全体は公表資料の再計算で市の公式見解ではないこと、署所別は目安にすぎないこと、上限シナリオは強い前提であることなどです。特に上限は、年1.9%の複利で伸びる仮定で、2050年に約2倍になります。数字を引用するときはこの注意も一緒に伝えてください。");
  const up = Math.pow(1 + TREND.slopeAll, 2050 - 2024);
  const items = [
    ["全体は公表資料の再計算で、市の公式見解ではない", false],
    ["署所別は推定（目安）", true],
    [`上限シナリオは年${f1(TREND.slopeAll * 100)}%の複利で2050年に約${Math.round(up)}倍になる強い前提`, false],
    ["人口は登録人口ベース（推計人口より約5万人少ない）", false],
    ["区別の不搬送率・時間帯別は公表データが無く載せていない", false]];
  const rh = 0.88, rg = 0.14;
  items.forEach((it, i) => {
    const y = TOP - 0.05 + i * (rh + rg);
    card(s, MX, y, CW, rh);
    s.addText(String(i + 1), { x: MX + 0.25, y, w: 0.6, h: rh, margin: 0, fontFace: NUM, fontSize: 28, bold: true, color: BLUE, valign: "middle" });
    txt(s, it[0], { x: MX + 1.0, y, w: CW - 1.0 - (it[1] ? 1.4 : 0.3), h: rh, fontSize: 18, valign: "middle" });
    if (it[1]) tag(s, W - MX - 1.1, y + (rh - 0.34) / 2);
  });
}

// =============== 21 まとめ ===============
{
  const s = base("まとめ：3行と、次の一歩", null,
    "まとめです。10年で12%の増加は確実で、25%から38%もあり得ます。増えるのは85歳以上で、基準の隊数は今すでに不足しており、先に詰まるのは1隊だけの出張所です。次の一歩として、増隊の目安づくり、昼間人口を考えた配置、適正利用の啓発を提案します。詳しい数字はサイトで見られます。",
    { dark: true });
  const lines = [
    `10年で ${sgn(pct(L35, d24), 0)}%は確実、${sgn(pct(M35, d24), 0)}〜${sgn(pct(H35, d24), 0).replace("+", "")}%もあり得る`,
    "増えるのは85歳以上",
    "基準隊数は今すでに不足、先に詰まるのは1隊の出張所"];
  lines.forEach((l, i) => {
    const y = TOP + i * 1.05;
    s.addShape(pres.shapes.OVAL, { x: MX, y: y + 0.1, w: 0.7, h: 0.7, fill: { color: GREEN }, line: { color: GREEN, width: 0 } });
    s.addText(String(i + 1), { x: MX, y: y + 0.1, w: 0.7, h: 0.7, margin: 0, fontFace: NUM, fontSize: 24, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    txt(s, l, { x: MX + 1.0, y, w: CW - 1.0, h: 0.9, fontSize: 28, bold: true, color: "FFFFFF", valign: "middle" });
  });
  txt(s, "次の一歩：増隊の目安づくり　／　昼間人口を考慮した配置　／　適正利用の啓発", { x: MX, y: TOP + 3.4, w: CW, h: 0.5, fontSize: 20, color: SKY, bold: true });
  txt(s, "https://ajp-4dev.github.io/fukuoka-ems-2035/", { x: MX, y: TOP + 4.2, w: CW, h: 0.5, fontSize: 20, color: "FFFFFF" });
}

await pres.writeFile({ fileName: path.join(__dir, "fukuoka-ems-2035-slides.pptx") });
console.log("OK: fukuoka-ems-2035-slides.pptx");
warn.forEach(w => console.log("WARN", w));
