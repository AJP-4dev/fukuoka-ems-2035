/* 第9章 署所（推定）（35秒）— 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * 1.4–2.2  2D 地図（7区）がワイプで現れる
 * 2.2–3.2  31署所の点が1秒以内に全部出る（大きさ＝隊数、色＝2035年の1隊あたり 0–7,000、隊なし＝中空の輪、機動救急＝小さな菱形）
 * 6.0–13.6 上位3署所のチップ（堅粕・曰佐・田隈）＋地図上の赤い輪
 * 14.2–21.6 次の3署所（姪浜・和白・桧原）
 * 22.2–34.8 赤枠の「推定」チップ＋3,000件超えの数＋救急隊なしの出張所（中空の輪が呼吸する） */
(() => {
  const Y = '2035';
  const BOX = { x: 900, y: 150, w: 940, h: 740 };
  const PU = (s) => s.perUnit[Y];
  const COLR = (v) => ramp(['#c9d2de', '#f4a259', '#e63946'], v / 7000);
  // 区名の位置（重心からのずらし。署所の点と重ならないところへ）
  const LOFF = { 東: [0, -30], 博多: [70, -70], 中央: [-60, -70], 南: [10, 100], 城南: [-20, 110], 早良: [0, 80], 西: [0, -30] };
  const short = (n) => n.replace('出張所', '').replace('消防署', '');
  const RANKED = ST.filter((s) => PU(s) != null).sort((a, b) => PU(b) - PU(a));
  const TOP1 = RANKED.slice(0, 3), TOP2 = RANKED.slice(3, 6);
  const NONE = ST.filter((s) => s.units === 0);
  const KIDO = ST.find((s) => s.kind === '本部');
  const BASE_ST = ST.find((s) => s.kind === '署' && s.ward === KIDO.ward && s.lon === KIDO.lon);   // 中央消防署
  const N_ALL = RANKED.length;                                                                   // 26
  const nOver = (y) => RANKED.filter((s) => s.perUnit[yk(y)] >= 3000).length;                    // 13 → 15
  const rad = (s) => 5 + 5 * s.units;                                                            // 1隊 10px、2隊 15px
  // 出る順: 西→東（0.6秒に広げ、各点 0.4 秒で伸びる → 1秒以内に全部）
  const lonMin = Math.min(...ST.map((s) => s.lon)), lonMax = Math.max(...ST.map((s) => s.lon));
  const tOn = (s) => 2.2 + 0.6 * (s.lon - lonMin) / (lonMax - lonMin);
  const DRAW = ST.filter((s) => s.kind !== '本部').sort((a, b) => b.units - a.units);           // 大きい点を先に（下に）
  const SETS = [[TOP1, 6.0, 13.6], [TOP2, 14.2, 21.6]];
  const T_EST = 22.2;
  // 赤枠の角丸チップ（「推定」用）。chip と同じ寸法・入退場、罫だけ赤
  function estChip(lt, t0, t1, s, x, y) {
    if (lt < t0 || lt > t1) return;
    DBG.chips++;
    const size = 20, padX = 14, hgt = 40, wAll = tw(s, size, 800) + padX * 2;
    const u = E.outCubic(P(lt, t0, 0.45)), v = E.inOut(P(lt, t1 - 0.3, 0.3));
    clipRect(x - 2 + (wAll + 4) * v, y - 2, (wAll + 4) * (u - v), hgt + 4, () => {
      rrect(x + 1, y + 1, wAll - 2, hgt - 2, 6, '#ffffff', COL.red, 2);
      text(s, x + padX, y + hgt / 2 + 1, { size, w: 800, base: 'middle', c: COL.red });
    });
  }
  function diamond(x, y, r, c) { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fillStyle = c; g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.stroke(); }

  window.CHAPTERS[9] = {
    title: '署所（推定）',
    q: 'どの署所から詰まる？',
    concl: null,
    duration: 35,
    subs: [
      [1.6, 8.0, '先に詰まるのは、1隊の出張所'],
      [8.4, 13.6, TOP1.map((s) => short(s.name)).join('・')],
      [14.2, 21.6, `次に${TOP2.map((s) => short(s.name)).join('・')}`],
      [22.4, 34.8, '推定値。公式の統計ではない'],
    ],
    setup(ctx) {},
    draw(ctx, lt, t) {
      /* ── 右: 地図と署所の点 ── */
      const mu = E.outCubic(P(lt, 1.4, 0.8));
      if (mu <= 0) return;
      let xf = null;
      wipe(mu, BOX.x - 20, BOX.y - 20, BOX.w + 40, BOX.h + 40, () => {
        xf = drawMap(BOX, () => '#e3e8ef', { stroke: '#ffffff', lw: 2 });
        WD.forEach((w) => { const [x, y] = wardC(xf, w), o = LOFF[w.name] || [0, -30]; text(wn(w), x + o[0], y + o[1], { size: 20, c: COL.sub, align: 'center', halo: 4, haloC: '#e3e8ef' }); });
      });
      if (!xf) xf = mapXf(BOX);
      const pos = (s) => xf.f(s.lon, s.lat);
      // 今出ているチップの署所（赤い輪）
      const active = [];
      SETS.forEach(([set, a, b]) => { if (lt >= a && lt <= b) set.forEach((s, k) => active.push([s, a + k * 0.3, b])); });
      const breath = (k) => 0.5 + 0.5 * Math.sin((lt - 3.2) * Math.PI * 0.9 - k * 0.6);
      DRAW.forEach((s) => {
        const u = E.outBack(P(lt, tOn(s), 0.4));
        if (u <= 0) return;
        const [x, y] = pos(s), r = rad(s) * clamp(u, 0, 1.25);
        if (s.units === 0) {
          // 救急隊なし: 中空の輪（推定チップの区間は小さく呼吸する）
          const bb = lt >= T_EST ? 2 * breath(NONE.indexOf(s)) : 0;
          g.beginPath(); g.arc(x, y, 7 * clamp(u, 0, 1.25) + bb, 0, Math.PI * 2);
          g.strokeStyle = COL.navy; g.lineWidth = 2; g.stroke();
        } else {
          dot(x, y, r, COLR(PU(s)));
          g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.strokeStyle = 'rgba(20,33,61,0.55)'; g.lineWidth = 1.2; g.stroke();
        }
      });
      // 機動救急: 中央消防署の右上に小さな菱形
      {
        const u = E.outBack(P(lt, tOn(KIDO) + 0.1, 0.4));
        if (u > 0) { const [x, y] = pos(BASE_ST); diamond(x + 20, y - 20, 8 * clamp(u, 0, 1.25), COL.navy); }
      }
      // チップの署所: 赤い輪＋地図上の短い名前
      active.forEach(([s, t0, t1], k) => {
        const [x, y] = pos(s), r = rad(s);
        const u = E.outCubic(P(lt, t0, 0.4)) * (1 - E.inOut(P(lt, t1 - 0.3, 0.3)));
        if (u <= 0) return;
        withAlpha(u, () => {
          g.beginPath(); g.arc(x, y, r + 6 + 2 * breath(k), 0, Math.PI * 2); g.strokeStyle = COL.red; g.lineWidth = 2.5; g.stroke();
        });
        const left = x > BOX.x + BOX.w - 160;
        wtext(lt, t0, t1 - 0.3, short(s.name), x + (left ? -(r + 12) : r + 12), y + 7, { size: 20, w: 800, c: COL.ink, halo: 5, align: left ? 'right' : 'left' });
      });

      /* ── 左: 文字・凡例・チップ ── */
      wtext(lt, 1.6, null, '署所ごとの負担', LX, 240, { size: 48 });
      wtext(lt, 1.9, null, '2035年、1隊あたりの出場（推計）\n点の大きさ＝救急隊の数\n色＝1隊あたりの件数', LX, 330, { size: 28, lead: 44 });
      // 凡例（色のランプ・隊なし・機動救急）
      wipe(E.outCubic(P(lt, 3.0, 0.6)), LX - 6, 740, LW, 110, () => {
        const x0 = LX, x1 = LX + 300, y0 = 760;
        for (let x = x0; x < x1; x += 2) { g.fillStyle = COLR(7000 * (x - x0) / (x1 - x0)); g.fillRect(x, y0, 2.5, 16); }
        numText('0', x0, y0 + 42, { size: 20, c: COL.sub });
        numText('7,000件', x1, y0 + 42, { size: 20, c: COL.sub, align: 'right' });
        g.beginPath(); g.arc(x1 + 50, y0 + 8, 7, 0, Math.PI * 2); g.strokeStyle = COL.navy; g.lineWidth = 2; g.stroke();
        text('救急隊なし', x1 + 66, y0 + 15, { size: 20, c: COL.sub });
        diamond(x1 + 50, y0 + 42, 8, COL.navy);
        text('機動救急', x1 + 66, y0 + 49, { size: 20, c: COL.sub });
      });
      SETS.forEach(([set, a, b]) => set.forEach((s, k) => {
        chip(lt, a + k * 0.3, b, `${s.name}（${wn(s.ward)}） ${fmt(PU(s))}件`, LX, 520 + k * 52, { c: COLR(PU(s)) });
      }));
      estChip(lt, T_EST, 34.8, '推定', LX, 520);
      chip(lt, T_EST + 0.3, 34.8, `1隊3,000件超え ${nOver(2025)}→${nOver(2035)}署所（${N_ALL}署所中）`, LX, 572, { c: COL.red });
      chip(lt, T_EST + 0.6, 34.8, `救急隊なし: ${NONE.map((s) => short(s.name)).join('、')}`, LX, 624, { c: COL.navy });
      wtext(lt, T_EST + 1.4, null, '区の出場を、署所の受け持ち人口で割り振った推計', LX, 700, { size: 20, c: COL.sub });
    },
  };
})();
