/* 第1章 問い — 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * 見せる動き: 人口（紺）と出場（赤）の2本の線が同時に伸び、1枚に重なって差の帯（赤の薄塗り）が開く。 */
(() => {
  const Y0 = 2025, Y1 = 2035;
  const YS = []; for (let y = Y0; y <= Y1; y++) YS.push(y);
  const POP_S = YS.map((y) => [y, cityPop(y)]);
  const DSP_S = YS.map((y) => [y, SC.L(y)]);
  const POP_I = (v) => v / cityPop(Y0) * 100, DSP_I = (v) => v / SC.L(Y0) * 100;
  const dPop = POP_I(cityPop(Y1)) - 100, dDsp = DSP_I(SC.L(Y1)) - 100;     // +2.3 / +12.0
  const E85 = [cityPop(Y0, 'e3'), cityPop(Y1, 'e3')];                       // 6.1万 → 9.3万
  window.CHAPTERS[1] = {
    title: '問い', q: '人口が少し増えると、救急は？', concl: null, duration: 18,
    subs: [[1.6, 5.8, '人口は少し増える'], [6.2, 11.6, '救急はもっと増える。なぜ？'], [12.2, 17.6, '答えは、年齢']],
    uses3D: () => false,
    setup(ctx) {},
    draw(ctx, lt, t) {
      const m = eio(lt, 8.6, 1.8);                       // 2枚 → 1枚に重なる
      const A = { x: 820, y: 330, w: 450, h: 380 }, B = { x: 1380, y: 330, w: 450, h: 380 }, MG = { x: 820, y: 250, w: 740, h: 540 };
      const xr = (r, y) => r.x + (y - Y0) / (Y1 - Y0) * r.w;
      const yr = (r, lo, hi, v) => r.y + r.h - (v - lo) / (hi - lo) * r.h;
      const idxY = (v) => yr(MG, 98, 114, v);
      const popPts = POP_S.map(([y, v]) => [lerp(xr(A, y), xr(MG, y), m), lerp(yr(A, 1.58e6, 1.66e6, v), idxY(POP_I(v)), m)]);
      const dspPts = DSP_S.map(([y, v]) => [lerp(xr(B, y), xr(MG, y), m), lerp(yr(B, 0.95e5, 1.15e5, v), idxY(DSP_I(v)), m)]);

      /* 軸（細い基線）と見出し（2枚の間だけ） */
      const ax = E.outCubic(P(lt, 1.3, 0.6));
      if (m < 1) withAlpha(1 - m, () => {
        line(A.x, A.y + A.h, A.x + A.w * ax, A.y + A.h, COL.line, 1);
        line(B.x, B.y + B.h, B.x + B.w * ax, B.y + B.h, COL.line, 1);
      });
      phase(lt, 1.3, 8.4, () => {
        wtext(lt, 1.3, null, '市の人口', A.x, A.y - 44, { size: 28, c: COL.navy });
        wtext(lt, 1.3, null, '救急出場（人口変化のみ）', B.x, B.y - 44, { size: 28, c: COL.red });
        [[A, Y0], [A, Y1], [B, Y0], [B, Y1]].forEach(([r, y], k) => wtext(lt, 1.5, null, String(y), xr(r, y), r.y + r.h + 36, { size: 20, tab: true, c: COL.sub, align: k % 2 ? 'right' : 'left' }));
        // 終点の増減（線が届いてから）
        const pe = popPts[popPts.length - 1], de = dspPts[dspPts.length - 1];
        wtext(lt, 5.0, null, `${sgn(dPop)}%`, pe[0], pe[1] - 22, { size: 28, tab: true, c: COL.navy, align: 'right' });
        wtext(lt, 5.0, null, `${sgn(dDsp)}%`, de[0], de[1] - 22, { size: 28, tab: true, c: COL.red, align: 'right' });
      }, [800, 230, 1060, 560]);

      /* 重なった後: 基準線・年・差の帯 */
      if (m > 0) {
        const y100 = idxY(100);
        line(MG.x, y100, MG.x + MG.w * m, y100, COL.line, 1, [6, 6]);
        wtext(lt, 10.0, null, '2025年＝100', MG.x, y100 + 34, { size: 20, c: COL.sub });
        wtext(lt, 10.0, null, '2035年', MG.x + MG.w, y100 + 34, { size: 20, c: COL.sub, align: 'right' });
        // 差の帯: 左→右に開く（マスクワイプ）
        const bu = E.inOut(P(lt, 11.0, 1.8));
        if (bu > 0) clipRect(MG.x - 2, MG.y - 20, (MG.w + 4) * bu, MG.h + 40, () => {
          g.beginPath();
          dspPts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
          for (let k = popPts.length - 1; k >= 0; k--) g.lineTo(popPts[k][0], popPts[k][1]);
          g.closePath(); g.fillStyle = 'rgba(230,57,70,0.14)'; g.fill();
        });
      }
      const u = E.outCubic(P(lt, 1.4, 3.0));
      polyline(popPts, u, COL.navy, 4);
      polyline(dspPts, u, COL.red, 4);
      if (m >= 1) {
        const pe = popPts[popPts.length - 1], de = dspPts[dspPts.length - 1];
        wtext(lt, 10.6, null, `人口 ${sgn(dPop)}%`, pe[0] + 16, pe[1] + 8, { size: 28, c: COL.navy });
        wtext(lt, 10.6, null, `救急出場 ${sgn(dDsp)}%`, de[0] + 16, de[1] + 8, { size: 28, c: COL.red });
        const ou = E.outCubic(P(lt, 12.6, 0.5));
        if (ou > 0) { dot(pe[0], pe[1], 7 * ou, COL.navy); dot(de[0], de[1], 7 * ou, COL.red); }
      }

      /* 左カラム */
      phase(lt, 1.4, 8.4, () => {
        wtext(lt, 1.6, null, '市の人口（2025→2035年、市の推計）', LX, 330, { size: 20, c: COL.sub });
        wtext(lt, 1.8, null, `${man(cityPop(Y0))}人 → ${man(cityPop(Y1))}人`, LX, 396, { size: 48, tab: true });
        wtext(lt, 3.0, null, '救急出場（同じ期間、人口変化のみ）', LX, 500, { size: 20, c: COL.sub });
        wtext(lt, 3.2, null, `${fmt(SC.L(Y0))}件 → ${fmt(SC.L(Y1))}件`, LX, 566, { size: 48, tab: true, c: COL.red });
        wtext(lt, 6.4, null, '人口の伸びより、救急の伸びが大きい', LX, 660, { size: 28 });
        rule(lt, 6.6, LX, 682, tw('人口の伸びより、救急の伸びが大きい', 28), COL.red, 2);
      }, [0, 280, 790, 440]);
      wtext(lt, 9.0, null, '2035年の変化', LX, 330, { size: 28, c: COL.sub });
      wtext(lt, 9.4, null, `人口 ${sgn(dPop)}%`, LX, 410, { size: 48, tab: true });
      wtext(lt, 10.2, null, '救急出場', LX, 500, { size: 28 });
      wtext(lt, 10.4, null, `${sgn(dDsp)}%`, LX, 630, { size: 120, w: 600, tab: true, c: COL.red });
      // 答えの手がかり（年齢）
      wtext(lt, 13.6, null, '85歳以上の人口', LX, 730, { size: 28, c: AGEC.e3 });
      wtext(lt, 14.2, null, `${man(E85[0])}人 → ${man(E85[1])}人`, LX, 790, { size: 28, tab: true });
      rule(lt, 14.8, LX, 812, tw(`${man(E85[0])}人 → ${man(E85[1])}人`, 28, 600, true), AGEC.e3, 2);
      wtext(lt, 15.6, null, `×${(E85[1] / E85[0]).toFixed(2)}`, LX + tw(`${man(E85[0])}人 → ${man(E85[1])}人`, 28, 600, true) + 28, 790, { size: 28, tab: true, c: AGEC.e3 });
    },
  };
})();
