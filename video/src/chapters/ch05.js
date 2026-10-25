/* 第5章 結果② 誰が — 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * 見せる動き: 出場件数の年齢6帯の帯が 2025→2035 で切り替わり、紫（85歳以上）だけが太くなる。
 * 後半は 85歳以上の人口カウンター（6.1万→9.3万）と搬送率の階段。 */
(() => {
  const ntw = (s, size) => [...s].reduce((a, ch) => a + tw(/[0-9]/.test(ch) ? '0' : ch, size, 600, true), 0);   // numText と同じ幅
  // 年齢6帯の出場件数（人口変化のみ＝下限）
  const BA = (y) => { const o = {}; AGE.forEach((a) => { o[a] = sumW((w) => w.byAge[yk(y)][a]); }); return o; };
  const B25 = BA(2025), B35 = BA(2035);
  const TOT = (o) => AGE.reduce((s, a) => s + o[a], 0);
  const e3a = cityPop(2025, 'e3'), e3b = cityPop(2035, 'e3');
  const OLD = ['e1', 'e2', 'e3'];
  const oldP = (y) => OLD.reduce((s, a) => s + cityPop(y, a), 0);
  const RATE = {}; AGE.forEach((a) => { RATE[a] = DATA.rates[a] * 100; });
  const RMAX = RATE.e3;
  const ONE_IN = (100 / RATE.e3).toFixed(1);                  // 3.4人に1人
  const XW = (RATE.e3 / RATE.w).toFixed(1);                   // 18–64歳の 9.5倍
  const MUL = (e3b / e3a).toFixed(2);                          // ×1.51
  // 階段の強調: [開始, 終了, 濃く見せる区分]
  const SFOC = [[21.2, 29.0, ['e3']], [29.0, 34.2, ['e1', 'e2', 'e3']], [34.2, 99, ['e3', 'w']]];
  const sdim = (lt, a) => SFOC.reduce((d, [s0, s1, ks]) => (ks.includes(a) ? d : Math.max(d, Math.min(E.inOut(P(lt, s0, 0.5)), 1 - E.inOut(P(lt, s1, 0.5))))), 0);

  // 帯（右上）: 85歳以上を左端に置き、紫の右端だけが伸びるのを見せる
  const BX = 980, BW = 840, SCB = BW / 116000, BH = 76;
  const BORD = [...AGE].reverse();
  function band(y, vals, u, dimK) {
    let x = BX;
    BORD.forEach((a) => {
      const ww = vals[a] * SCB * u;
      const al = a === 'e3' ? 1 : 1 - 0.6 * dimK;
      withAlpha(al, () => { g.fillStyle = AGEC[a]; g.fillRect(x, y, Math.max(0, ww - 3), BH); });
      if (ww > 120 && (a === 'w' || a === 'e2' || a === 'e3')) text(AGEL[a], x + 14, y + BH / 2 + 1, { size: 20, w: 600, c: '#ffffff', base: 'middle', a: a === 'e3' ? 1 : 1 - dimK });
      x += ww;
    });
    return x;
  }
  // 階段（右）
  const SB = 770, SH = 380, SX = 960, SS = 146, SWD = 100;

  window.CHAPTERS[5] = {
    title: '結果② 誰が',
    q: '増えるのは、誰？',
    concl: null,
    duration: 40,
    subs: [
      [1.6, 7.6, '救急を使う人の年齢の内訳'],
      [8.0, 14.0, '増える分のほぼ全部は65歳以上'],
      [14.4, 20.8, `85歳以上の人口は${man(e3a)}→${man(e3b)}`],
      [21.2, 28.6, `85歳以上は${ONE_IN}人に1人が1年に運ばれる`],
      [29.0, 33.8, '人が増え、運ばれる割合も高い年代'],
      [34.2, 39.6, `18–64歳の${XW}倍の割合`],
    ],
    setup(ctx) {},
    draw(ctx, lt, t) {
      /* ═════ 前半（1.2–16.4）: 年齢構成の帯 ═════ */
      phase(lt, 1.4, 16.2, () => {
        wtext(lt, 1.5, null, '救急を使う人の年齢', LX, 240, { size: 48 });
        wtext(lt, 1.9, null, '出場件数を年齢6区分に分けた内訳\n2035年は人口変化のみの推計', LX, 300, { size: 20, c: COL.sub, lead: 32 });
        wtext(lt, 8.6, null, '増える分のほぼ全部は', LX, 500, { size: 28 });
        wtext(lt, 8.9, null, '65歳以上', LX, 580, { size: 48 });
        wtext(lt, 10.4, null, `85歳以上だけで ${sgn((B35.e3 - B25.e3) / 10000)}万件`, LX, 650, { size: 28, tab: true, c: COL.purple });
        rule(lt, 13.0, LX, 662, ntw(`85歳以上だけで ${sgn((B35.e3 - B25.e3) / 10000)}万件`, 28), COL.purple, 2, 1.0);
        wtext(lt, 11.4, null, `全体の増加は ${sgn((TOT(B35) - TOT(B25)) / 10000)}万件`, LX, 698, { size: 28, tab: true, c: COL.sub });
      }, [0, 150, 790, 720]);

      phase(lt, 1.4, 16.2, () => {
        const dk = E.inOut(P(lt, 6.6, 0.5));
        wtext(lt, 1.6, null, '2025年', RX0 + 10, 250, { size: 28 });
        band(212, B25, E.outCubic(P(lt, 1.8, 1.6)), dk);
        if (lt > 5.0) {
          wtext(lt, 5.0, null, '2035年', RX0 + 10, 370, { size: 28 });
          const m = eio(lt, 6.0, 1.6), v = {};
          AGE.forEach((a) => { v[a] = lerp(B25[a], B35[a], m); });
          band(332, v, E.outCubic(P(lt, 5.0, 0.6)), dk);
          // 2025年の紫の右端（帯の上の小さな印）
          const x25 = BX + B25.e3 * SCB;
          if (m > 0.05) { g.fillStyle = COL.navy; g.fillRect(x25 - 1, 322, 2, 8); }
          if (m > 0.2) wtext(lt, 7.6, null, `×${(B35.e3 / B25.e3).toFixed(2)}`, BX + v.e3 * SCB - 12, 318, { size: 20, tab: true, c: COL.purple, align: 'right' });
        }
        // 凡例（年齢6区分）
        let lx = BX;
        BORD.forEach((a, k) => {
          const u = E.outCubic(P(lt, 2.4 + k * 0.1, 0.4));
          if (u <= 0) return;
          g.fillStyle = AGEC[a]; g.fillRect(lx, 452, 16 * u, 16);
          wtext(lt, 2.4 + k * 0.1, null, AGEL[a], lx + 22, 468, { size: 20, c: COL.sub });
          lx += 22 + tw(AGEL[a], 20) + 22;
        });
        // 増減のバー（2025→2035、件）
        wtext(lt, 8.5, null, '2025→2035年の増減（件）', BX, 540, { size: 20, c: COL.sub });
        const zx = 1260, ks = 0.042, y0 = 566;
        AGE.forEach((a, k) => {
          const d = B35[a] - B25[a], y = y0 + k * 48, u = E.outCubic(P(lt, 8.8 + k * 0.12, 0.7));
          if (u <= 0) return;
          text(AGEL[a], BX, y + 23, { size: 20, w: 600, c: COL.sub });
          const L = d * ks * u;
          g.fillStyle = AGEC[a]; g.fillRect(L >= 0 ? zx : zx + L, y + 4, Math.max(2, Math.abs(L)), 28);
          const lab = `${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}`;
          if (u > 0.6) text(lab, L >= 0 ? zx + L + 10 : zx + L - 10, y + 25, { size: 20, num: true, c: a === 'e3' ? COL.purple : COL.sub, align: L >= 0 ? 'left' : 'right' });
        });
      }, [RX0, 140, 1060, 760]);

      /* ═════ 後半（16.6–40）: 85歳以上の人口 × 搬送率の階段 ═════ */
      wtext(lt, 16.6, null, '85歳以上の人口（2025→2035年）', LX, 220, { size: 20, c: COL.sub });
      if (lt >= 16.8) wtext(lt, 16.8, null, `${man(e3a)}人 → ${man(lerp(e3a, e3b, cnt(lt, 17.3, 1.4)))}人`, LX, 290, { size: 48, tab: true });
      wtext(lt, 18.4, null, `×${MUL}`, LX, 430, { size: 120, w: 600, tab: true, c: COL.purple });
      rule(lt, 21.0, LX, 480, LW, COL.line, 1);
      wtext(lt, 21.2, null, '100人あたり、1年に運ばれる人数', LX, 536, { size: 20, c: COL.sub });
      const s1 = `${RATE.e3.toFixed(1)}人＝`, s2 = `${ONE_IN}人に1人`;
      wtext(lt, 21.5, null, s1 + s2, LX, 604, { size: 48, tab: true });
      rule(lt, 26.4, LX + ntw(s1, 48), 622, ntw(s2, 48), COL.purple, 3, 1.0);
      chip(lt, 23.6, 37.0, '搬送率＝1年に救急車で運ばれる人の割合', LX, 660, { c: COL.navy });
      chip(lt, 29.4, 38.2, `65歳以上 ${man(oldP(2025))}→${man(oldP(2035))}人`, LX, 712, { c: AGEC.e1 });
      chip(lt, 31.8, 39.4, `65歳以上の割合 ${(oldP(2025) / cityPop(2025) * 100).toFixed(1)}%→${(oldP(2035) / cityPop(2035) * 100).toFixed(1)}%`, LX, 764, { c: AGEC.e2 });

      // 右: 搬送率の階段
      phase(lt, 16.4, 41, () => {
        wtext(lt, 16.8, null, '搬送率（人口100人あたり、1年に運ばれる人数）', SX, 220, { size: 20, c: COL.sub });
        const bu = E.outCubic(P(lt, 16.8, 0.6));
        if (bu > 0) line(SX - 20, SB, lerp(SX - 20, RX1, bu), SB, COL.navy, 1);
        AGE.forEach((a, k) => {
          const v = RATE[a], x = SX + k * SS, hh = SH * v / RMAX;
          const last = a === 'e3';
          const u = E.outCubic(P(lt, 17.2 + k * 0.3 + (last ? 0.3 : 0), last ? 1.0 : 0.7));
          if (u <= 0) return;
          const al = 1 - 0.6 * sdim(lt, a);
          withAlpha(al, () => { g.fillStyle = AGEC[a]; g.fillRect(x, SB - hh * u, SWD, hh * u); });
          text(AGEL[a], x + SWD / 2, SB + 34, { size: 20, w: 600, c: COL.sub, align: 'center' });
          if (u > 0.9) withAlpha(al, () => wtext(lt, 17.8 + k * 0.3 + (last ? 0.5 : 0), null, `${v.toFixed(1)}人`, x + SWD / 2, SB - hh - 16, { size: 28, tab: true, align: 'center', c: last ? COL.purple : COL.ink }));
        });
        // 100人のうち29.6人（10×10のマス。枠が出てから紫が満ちる）
        const gx = SX, gy = 262, gc = 18, gp = 5, fillN = RATE.e3;
        const fu = E.outCubic(P(lt, 24.4, 0.5)), pu = E.inOut(P(lt, 25.0, 0.9));
        if (fu > 0) wipe(fu, gx - 2, gy - 2, 10 * (gc + gp) + 4, 10 * (gc + gp) + 4, () => {
          for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
            const k = r * 10 + c, x = gx + c * (gc + gp), y = gy + r * (gc + gp);
            g.strokeStyle = COL.grey; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, gc - 1, gc - 1);
            const f = clamp(fillN * pu - k);
            if (f > 0) { g.fillStyle = COL.purple; g.fillRect(x, y, gc * f, gc); }
          }
        });
        wtext(lt, 25.6, null, `100人のうち ${RATE.e3.toFixed(1)}人`, gx + 10 * (gc + gp) + 16, gy + 26, { size: 20, tab: true, c: COL.purple });
        // 35.8–: 18–64歳の高さを85歳以上まで延ばす（横の破線）→ 倍率
        const xw = SX + 2 * SS + SWD, xe = SX + 5 * SS, yw = SB - SH * RATE.w / RMAX;
        const cu = E.outCubic(P(lt, 34.4, 0.9));
        if (cu > 0) line(xw + 8, yw, lerp(xw + 8, xe - 8, cu), yw, COL.purple, 1.5, [5, 5]);
        wtext(lt, 35.2, null, `18–64歳の${XW}倍`, xe - 16, SB - SH - 4, { size: 28, tab: true, c: COL.purple, align: 'right' });
      }, [RX0, 140, 1060, 760]);
    },
  };
})();
