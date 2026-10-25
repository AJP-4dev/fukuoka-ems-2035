/* 第4章 結果① 市全体 — 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * 見せる動き: 実績線（赤）が2024年で止まり、そこから3本の推計線が2035年へ伸びる（左カラムで2035年の値がカウンターで回る）。 */
(() => {
  // 実績 2013〜2024（消防年報）
  const HIST = Object.keys(SER.dispatch).map((y) => [+y, SER.dispatch[y]]).sort((a, b) => a[0] - b[0]);
  const Y0 = HIST[0][0], V0 = HIST[0][1];
  const B25 = SC.L(2025);                                     // 2025年の基準（区計の推計 100,139）
  const pre = (TR.slopePre * 100).toFixed(1), all = (TR.slopeAll * 100).toFixed(1);
  // [キー, 名前, 色, 破線, 意味（チップ）]
  const SCN = [
    ['L', '下限', COL.navy, null, '下限＝1人あたりの利用は今のまま'],
    ['M', '中間', COL.orange, null, `中間＝コロナ前の伸び 年${pre}%が${TR.capYear}年まで`],
    ['H', '上限', COL.red, [3, 7], `上限＝コロナ後の伸び 年${all}%`],
  ];
  const V35 = {}, PCT = {};
  SCN.forEach(([k]) => { V35[k] = SC[k](2035); PCT[k] = (V35[k] / B25 - 1) * 100; });
  const SUB = DATA.scn;                                        // シナリオ名（人口変化のみ／…）
  // グラフ（右）
  const C = { x0: 900, x1: 1680, y0: 200, y1: 790 };
  const X = (y) => lerp(C.x0, C.x1, (y - Y0) / (2035 - Y0));
  const Y = (v) => lerp(C.y1, C.y0, v / 150000);
  const PROJ = {};
  SCN.forEach(([k]) => { PROJ[k] = [[2024, D24], ...YEARS.filter((y) => y <= 2035).map((y) => [y, SC[k](y)])].map(([y, v]) => [X(y), Y(v)]); });
  const T0 = (i) => 5.8 + i * 1.5;                             // 推計線 i の描き始め
  // 強調区間 [開始, 終了, 対象キー群]
  const FOCUS = [[10.8, 17.0, ['L']], [17.2, 23.6, ['M', 'H']], [24.0, 26.4, ['L']], [26.4, 28.8, ['M']], [28.8, 31.4, ['H']]];
  const dimOf = (lt, k) => FOCUS.reduce((d, [a, b, ks]) => (ks.includes(k) ? d : Math.max(d, Math.min(E.inOut(P(lt, a, 0.3)), 1 - E.inOut(P(lt, b, 0.3))))), 0);
  const CHIPT = [24.0, 26.4, 28.8];
  const ROWY = (i) => 352 + i * 128;
  const SUM = `2035年は ${man(V35.L)}〜${man(V35.H)}件`;

  window.CHAPTERS[4] = {
    title: '結果① 市全体',
    q: '2035年、市全体で何件？',
    concl: null,
    duration: 40,
    subs: [
      [1.6, 5.4, '2024年までの実績。10年で1.47倍'],
      [5.8, 10.4, '2024年から先は、3つのシナリオ'],
      [10.8, 16.8, '人口だけでも +12%'],
      [17.2, 23.6, '使われ方が変われば +25〜38%'],
      [24.0, 31.4, '違いは、1人あたりの使われ方'],
      [31.8, 39.6, 'どのシナリオでも、今より多い'],
    ],
    setup(ctx) {},
    draw(ctx, lt, t) {
      const alOf = (k) => 1 - 0.75 * dimOf(lt, k);

      /* ── 右: 軸（横線のみ） ── */
      const gu = E.outCubic(P(lt, 1.2, 0.6));
      [50000, 100000, 150000].forEach((v) => {
        if (gu > 0) line(C.x0, Y(v), lerp(C.x0, C.x1, gu), Y(v), COL.grid, 1);
        wtext(lt, 1.3, null, `${v / 10000}万`, C.x0 - 14, Y(v) + 7, { size: 20, c: COL.faint, align: 'right' });
      });
      if (gu > 0) line(C.x0, C.y1, lerp(C.x0, C.x1, gu), C.y1, COL.navy, 1);
      [2013, 2020, 2024, 2030, 2035].forEach((y) => wtext(lt, 1.4, null, `${y}`, X(y), C.y1 + 34, { size: 20, tab: true, c: COL.sub, align: 'center' }));
      wtext(lt, 4.5, null, '実績', X(2024) - 14, C.y0 + 6, { size: 20, c: COL.sub, align: 'right' });
      wtext(lt, 4.7, null, '推計', X(2024) + 14, C.y0 + 6, { size: 20, c: COL.sub });

      // 2025年の水準（横の破線）と、増えた分の面（左→右にゆっくり満ちる）
      const lu = E.outCubic(P(lt, 10.9, 1.0));
      if (lu > 0) line(X(2024), Y(B25), lerp(X(2024), X(2035), lu), Y(B25), COL.sub, 1.5, [6, 6]);
      wtext(lt, 11.6, null, '2025年の水準', X(2035) + 16, Y(B25) + 26, { size: 20, c: COL.sub });
      const area = (top, bot, t0, d, fill) => {
        const u = E.inOut(P(lt, t0, d));
        if (u <= 0) return;
        clipRect(X(2024), C.y0, (X(2035) - X(2024)) * u, C.y1 - C.y0, () => {
          g.beginPath();
          top.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
          [...bot].reverse().forEach(([x, y]) => g.lineTo(x, y));
          g.closePath(); g.fillStyle = fill; g.fill();
        });
      };
      area(PROJ.L, [[X(2024), Y(B25)], [X(2035), Y(B25)]], 11.4, 4.2, 'rgba(20,33,61,0.10)');   // 人口だけで増える分
      area(PROJ.H, PROJ.L, 17.4, 4.6, 'rgba(230,57,70,0.08)');                                    // 使われ方しだいの幅

      /* ── 右: 実績線（赤） ── */
      const anyF = FOCUS.some(([a, b]) => lt >= a && lt < b);
      withAlpha(anyF ? 0.55 : 1, () => polyline(HIST.map(([y, v]) => [X(y), Y(v)]), E.inOut(P(lt, 1.4, 3.0)), COL.red, 3.5));
      if (lt > 4.3) dot(X(2024), Y(D24), 6 * E.outBack(P(lt, 4.3, 0.4)), COL.red);
      wtext(lt, 4.3, 10.4, `2024年 ${fmt(D24)}件`, X(2024) - 16, Y(D24) + 40, { size: 20, tab: true, c: COL.red, align: 'right' });
      wtext(lt, 1.6, 10.4, `2013年 ${fmt(V0)}件`, X(2013) + 12, Y(V0) + 40, { size: 20, tab: true, c: COL.sub });

      /* ── 右: 推計線（見せる動き） ── */
      SCN.forEach(([k, , c, dash], i) => {
        const t0 = T0(i);
        withAlpha(alOf(k), () => {
          const tip = polyline(PROJ[k], E.outCubic(P(lt, t0, 1.2)), c, 3.5, dash);
          if (lt > t0 + 1.0) dot(X(2035), Y(V35[k]), 6 * E.outBack(P(lt, t0 + 1.0, 0.4)), c);
          if (tip && lt < t0 + 1.0) dot(tip[0], tip[1], 4, c);
        });
        // 2035年の値の横に増減率
        if (lt > t0 + 1.0) withAlpha(alOf(k), () => wtext(lt, t0 + 1.0, null, `${sgn(PCT[k])}%`, X(2035) + 16, Y(V35[k]) + 10, { size: 28, tab: true, c, halo: 6, haloC: COL.bg }));
      });
      wtext(lt, 9.4, null, '2025年比', X(2035) + 16, Y(V35.H) - 34, { size: 20, c: COL.sub });

      /* ── 左カラム ── */
      wtext(lt, 4.6, null, '2035年の出場件数', LX, 220, { size: 48 });
      wtext(lt, 5.4, null, `3つのシナリオで推計（2025年は ${fmt(B25)}件）`, LX, 268, { size: 20, c: COL.sub, tab: false });
      SCN.forEach(([k, name, c, dash], i) => {
        const t0 = T0(i) + 0.8, y = ROWY(i);
        withAlpha(1 - 0.55 * dimOf(lt, k), () => {
          rule(lt, t0, LX, y + 76, LW, COL.line, 1);
          const su = E.outCubic(P(lt, t0, 0.5));
          if (su > 0) line(LX, y - 10, LX + 36 * su, y - 10, c, 4, dash);
          wtext(lt, t0, null, name, LX + 52, y, { size: 28, w: 800 });
          wtext(lt, t0 + 0.1, null, SUB[k].name, LX + 52 + tw(name, 28, 800) + 14, y, { size: 20, c: COL.sub });
          if (lt > t0 + 0.1) numText(`${counter(lt, t0 + 0.1, V35[k])}件`, LX + LW, y + 4, { size: 48, align: 'right', c: k === 'L' ? COL.navy : COL.ink });
        });
        chip(lt, CHIPT[i], 39.4, SCN[i][4], LX + 52, y + 22, { c });
      });
      // 終盤のまとめ
      wtext(lt, 34.4, null, SUM, LX, 790, { size: 28 });
      rule(lt, 35.6, LX, 816, tw(SUM, 28), COL.navy, 2, 1.6);
    },
  };
})();
