/* 第3章 どう計算したか — 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * 見せる動き: 上段の5ステップの横フローが左→右へ組み上がる（線が走る）。各ステップの図は右に1つずつ。
 * 最後に東区の実例を縦の数字の列で（すべて DATA から計算）。 */
(() => {
  // ステップの区間 [開始, 終了, フロー上のラベル]
  const STP = [[1.2, 9.0, '① いまの人口'], [9.0, 18.0, '② 市の推計で将来へ'], [18.0, 30.0, '③ 年齢別の搬送率'], [30.0, 39.0, '④ 昼に来る人を足す'], [39.0, 47.0, '⑤ 校正係数']];
  const OPS = ['', '×', '＋', '×'];                        // ノード k→k+1 の間の演算
  const EX = 47.0;                                        // 東区の実例の開始
  const FY = 168, NX = (k) => LX + 16 + k * 400;          // フローの線の高さとノード位置
  const HIGASHI = ward('東'), HAKATA = ward('博多'), CHUO_W = ward('中央');
  const R = DATA.rates, DR = DATA.dispRatio;
  const RATIO_W = R.e3 / R.w;                              // 85歳以上 ÷ 18–64歳 ≈ 9.5
  const trOf = (w, y) => AGE.reduce((s, a) => s + w.pop[yk(y)][a] * R[a], 0);   // 年齢帯の人口×搬送率の合計
  const dayTr = (w) => DATA.dayf * (w.in - w.out) * R.w;                        // 昼間補正（搬送人員ベース）
  const PRE = sumW((w) => w.disp24 / w.fac) / sumW((w) => w.disp24);           // 校正前の当てはまり（計算÷実績）≈1.018
  const POPMAX = Math.max(...WD.map((w) => popT(w, 2035)));
  const popAt = (w, yv) => { const y0 = Math.floor(yv), y1 = Math.min(2035, y0 + 1), k = yv - y0; const o = {}; AGE.forEach((a) => { o[a] = lerp(w.pop[yk(y0)][a], w.pop[yk(y1)][a], k); }); return o; };
  const LBOX = [0, 250, 790, 660], RBOX = [RX0, 236, W - RX0, 674];
  // 博多区へ流れ込む矢印の出発区: 方向が重ならない（0.5rad 以上離れる）ものを近い順に
  const INTO = (() => {
    const c0 = C3[WI['博多']], out = [], angs = [];
    WD.map((w, i) => i).filter((i) => WD[i].name !== '博多')
      .sort((a, b) => Math.hypot(C3[a][0] - c0[0], C3[a][1] - c0[1]) - Math.hypot(C3[b][0] - c0[0], C3[b][1] - c0[1]))
      .forEach((i) => {
        const a = Math.atan2(C3[i][1] - c0[1], C3[i][0] - c0[0]);
        if (angs.every((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) > 0.5)) { out.push(i); angs.push(a); }
      });
    return out;
  })();

  // 左カラム: 見出し・言い換え・チップ
  function left(lt, a, b, title, body, chipS, chipC, chipT) {
    phase(lt, a, b - 0.4, () => {
      wtext(lt, a + 0.1, null, title, LX, 330, { size: 48 });
      wtext(lt, a + 0.5, null, body, LX, 410, { size: 28, lead: 44 });
    }, LBOX);
    if (chipS) chip(lt, chipT, b - 0.5, chipS, LX, 548, { c: chipC });
  }

  window.CHAPTERS[3] = {
    title: 'どう計算したか', q: 'どうやって計算した？', concl: null, duration: 60,
    subs: [[1.6, 8.6, 'まず、いまの人口を区×年齢で'], [9.2, 17.4, '市の推計で、2035年の人口へ'], [18.4, 23.6, '年齢ごとに、運ばれる割合は違う'],
      [24.0, 29.6, `85歳以上は18–64歳の${RATIO_W.toFixed(1)}倍`], [30.4, 38.6, '住んでいない人も倒れる'], [39.4, 46.6, '人口で見えない事情を1つの倍率に'],
      [47.4, 53.4, '例：東区で計算すると'], [53.8, 59.6, `2035年は${fmt(HIGASHI.disp['2035'])}件、${sgn(wDiff35(HIGASHI))}%`]],
    uses3D: () => false,
    setup(ctx) {},
    draw(ctx, lt, t) {
      /* ── 上段: 5ステップのフロー（左→右に組み上がる） ── */
      const act = STP.findIndex(([a, b]) => lt >= a && lt < b);   // 実例中は -1
      STP.forEach(([a], k) => {
        if (lt < a) return;
        if (k > 0) {
          const u = E.outCubic(P(lt, a, 0.7));
          line(NX(k - 1) + 10, FY, lerp(NX(k - 1) + 10, NX(k) - 10, u), FY, COL.navy, 1.5);
          if (OPS[k - 1] && u > 0.6) text(OPS[k - 1], (NX(k - 1) + NX(k)) / 2, FY + 1, { size: 20, w: 800, align: 'center', base: 'middle', halo: 10, haloC: COL.bg, c: COL.navy });
        }
        const cur = k === act, on = E.outCubic(P(lt, a + (k ? 0.5 : 0), 0.3));
        if (on > 0) dot(NX(k), FY, (cur ? 8 : 6) * on, COL.navy);
        if (cur && on > 0) { g.beginPath(); g.arc(NX(k), FY, 15 * on, 0, Math.PI * 2); g.strokeStyle = COL.navy; g.lineWidth = 1; g.stroke(); }
        wtext(lt, a + (k ? 0.5 : 0), null, STP[k][2], NX(k) - 16, FY + 44, { size: 20, w: cur || act < 0 ? 800 : 600, c: cur || act < 0 ? COL.ink : COL.sub });
      });
      // 実例: 赤い印が ①→⑤ を順に走る（2025年の計算 / 2035年の計算）
      [[48.2, 4.4], [54.4, 2.6]].forEach(([a, d]) => {
        const sw = E.inOut(P(lt, a, d));
        if (sw > 0 && sw < 1) { const x = lerp(NX(0), NX(4), sw); g.fillStyle = COL.red; g.fillRect(x - 6, FY - 6, 12, 12); }
      });

      /* ── 左カラム ── */
      left(lt, 1.2, 9.0, '① いまの人口', '区ごと、年齢ごとの人口\n（2025年の基準、登録人口）');
      left(lt, 9.0, 18.0, '② 市の推計で将来へ', '福岡市の将来人口推計\n（令和6年4月）をそのまま', `85歳以上 ${man(cityPop(2025, 'e3'))}人 → ${man(cityPop(2035, 'e3'))}人`, AGEC.e3, 13.0);
      left(lt, 18.0, 30.0, '③ 年齢別の搬送率を掛ける', '搬送率＝1年に救急車で\n運ばれる人の割合', `85歳以上は${(1 / R.e3).toFixed(1)}人に1人が運ばれる`, AGEC.e3, 23.8);
      left(lt, 30.0, 39.0, '④ 昼に来る人を足す', '通勤や通学で入ってくる\n人のぶんを足す（昼間補正）', `昼間補正 ${wn(HAKATA)} ${sgn(HAKATA.dayExtra, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}件`, COL.orange, 34.6);
      left(lt, 39.0, 47.0, '⑤ 実績に合わせる', '校正係数＝実績÷計算\n病院、繁華街、観光などを\nまとめて1つの倍率に', `校正前でも、市全体は${PRE.toFixed(3)}倍`, COL.navy, 43.6);
      // 補足の1行（各ステップ後半の小さな動き）
      phase(lt, 1.2, 8.6, () => wtext(lt, 5.6, null, '7区 × 6つの年齢帯', LX, 680, { size: 28 }), LBOX);
      phase(lt, 9.6, 17.6, () => {
        const yv = 2025 + 10 * eio(lt, 9.8, 6.4);
        wtext(lt, 9.6, null, `${Math.round(yv)}年`, LX, 760, { size: 120, w: 600, tab: true });
      }, LBOX);
      phase(lt, 18.0, 29.6, () => {
        wtext(lt, 27.0, null, '人口 × 搬送率 ＝ 運ばれる人数', LX, 680, { size: 28 });
        rule(lt, 27.3, LX, 702, tw('人口 × 搬送率 ＝ 運ばれる人数', 28), COL.navy, 2);
      }, LBOX);
      phase(lt, 30.0, 38.6, () => {
        const s4 = `${wn(HAKATA)}は、昼の人口が夜の${HAKATA.dn.toFixed(2)}倍`;
        wtext(lt, 32.0, null, s4, LX, 680, { size: 28 });
        rule(lt, 32.3, LX, 702, tw(s4, 28), COL.orange, 2);
        wtext(lt, 36.4, null, `${wn(CHUO_W)}は${CHUO_W.dn.toFixed(2)}倍`, LX, 760, { size: 28 });
      }, LBOX);
      phase(lt, 39.0, 46.6, () => wtext(lt, 45.0, null, '2025年の計算が2024年の実績に一致する', LX, 680, { size: 20, c: COL.sub }), LBOX);
      phase(lt, EX, 60, () => {
        wtext(lt, EX + 0.1, null, '例：東区', LX, 330, { size: 48 });
        wtext(lt, EX + 0.5, null, '①から⑤を順に計算すると、\n出場件数になる', LX, 410, { size: 28, lead: 44 });
        wtext(lt, 53.4, null, '2035年も同じ手順で', LX, 560, { size: 28 });
        rule(lt, 53.7, LX, 582, tw('2035年も同じ手順で', 28), COL.red, 2);
      }, LBOX);
      chip(lt, 57.0, 60.4, `2025年より ${sgn(wDiff35(HIGASHI))}%`, LX, 640, { c: COL.red });

      /* ── 右: ステップ①② 区×年齢の積み上げ棒（2025→2035） ── */
      phase(lt, 1.2, 17.6, () => {
        const yv = 2025 + 10 * eio(lt, 9.8, 6.4);
        const row = 64, y0 = 300, bx = 960, sc = 820 / (POPMAX * 1.05);
        const hi = win(lt, 6.4, 17.6, 0.5);              // 東区を強調（実例への伏線、他を薄く）
        WD.forEach((w, r) => {
          const y = y0 + r * row, gu = E.outCubic(P(lt, 1.6 + r * 0.08, 0.8));
          if (gu <= 0) return;
          withAlpha(w === HIGASHI ? 1 : 1 - 0.55 * hi, () => {
            text(wn(w), bx - 16, y + 30, { size: 20, w: w === HIGASHI && hi > 0.5 ? 800 : 600, c: COL.sub, align: 'right' });
            const p = popAt(w, yv); let x = bx;
            AGE.forEach((a) => { const ww = p[a] * sc * gu; g.fillStyle = AGEC[a]; g.fillRect(x, y + 8, Math.max(0, ww - 1), row - 22); x += ww; });
            if (w === HIGASHI && lt >= 6.6) {
              const tot = AGE.reduce((s, a) => s + p[a], 0);
              text(`${man(tot)}人`, x + 12, y + 30, { size: 20, num: true });
            }
          });
        });
        // 凡例
        let lx = bx;
        AGE.forEach((a) => {
          wipe(E.outCubic(P(lt, 2.6, 0.6)), lx - 4, 776, 200, 36, () => { g.fillStyle = AGEC[a]; g.fillRect(lx, 786, 14, 14); });
          wtext(lt, 2.6, null, AGEL[a], lx + 22, 801, { size: 20, c: COL.sub });
          lx += 22 + tw(AGEL[a], 20) + 26;
        });
        wtext(lt, 3.4, null, '人口（人）', bx, 272, { size: 20, c: COL.sub });
      }, RBOX);

      /* ── 右: ステップ③ 搬送率の階段（85歳以上 29.6 が最後に跳ねる） ── */
      phase(lt, 18.0, 29.6, () => {
        const base = 800, x0 = 860, gap = 150, bw = 100, hMax = 420, vmax = R.e3 * 100;
        wtext(lt, 18.4, null, '人口100人あたり、1年に運ばれる人数', x0, 300, { size: 20, c: COL.sub });
        const bl = E.outCubic(P(lt, 18.4, 0.6));
        if (bl > 0) line(x0 - 20, base, lerp(x0 - 20, RX1, bl), base, COL.navy, 1);
        AGE.forEach((a, k) => {
          const v = R[a] * 100, x = x0 + k * gap, h = hMax * v / vmax, last = k === 5;
          const ts = last ? 21.6 : 18.8 + k * 0.4;
          const u = last ? E.outBack(P(lt, ts, 0.9)) : E.outCubic(P(lt, ts, 0.7));
          if (u <= 0) return;
          g.fillStyle = AGEC[a]; g.fillRect(x, base - h * u, bw, h * u);
          wtext(lt, ts, null, AGEL[a], x + bw / 2, base + 34, { size: 20, c: COL.sub, align: 'center' });
          wtext(lt, ts + (last ? 0.8 : 0.5), null, `${v.toFixed(1)}人`, x + bw / 2, base - h - 16, { size: last ? 48 : 28, tab: true, align: 'center', c: last ? AGEC.e3 : COL.ink });
        });
        // 18–64歳の高さから85歳以上へ: 破線が走り、差が縦に伸びる
        const hw = hMax * R.w * 100 / vmax, xw = x0 + 2 * gap + bw, xe = x0 + 5 * gap;
        const du = E.outCubic(P(lt, 24.2, 0.9));
        if (du > 0) line(xw + 6, base - hw, lerp(xw + 6, xe + bw + 14, du), base - hw, COL.navy, 1, [5, 5]);
        const vu = E.outCubic(P(lt, 25.0, 0.9));
        if (vu > 0) arrow(xe + bw + 14, base - hw, xe + bw + 14, lerp(base - hw, base - hMax + 4, vu), COL.navy, 2, 10);
        wtext(lt, 25.6, null, `${RATIO_W.toFixed(1)}倍`, xe + bw + 26, base - (hw + hMax) / 2 + 10, { size: 28, tab: true });
      }, RBOX);

      /* ── 右: ステップ④ 博多区に人が流れ込む（小さな2D地図） ── */
      phase(lt, 30.0, 38.6, () => {
        const box = { x: 960, y: 280, w: 800, h: 560 };
        const xf = mapXf(box), mu = E.outCubic(P(lt, 30.2, 0.9));
        wipe(mu, box.x - 40, box.y - 20, box.w + 80, box.h + 40, () => drawMap(box, (w) => (w === HAKATA ? COL.orange : '#e3e8ef')));
        const [hx, hy] = wardC(xf, HAKATA);
        INTO.forEach((i, k) => {
          const [cx, cy] = wardC(xf, WD[i]);
          const dl = Math.hypot(cx - hx, cy - hy), L = Math.max(dl, 170);
          const sx = hx + (cx - hx) / dl * L, sy = hy + (cy - hy) / dl * L;
          const au = E.outCubic(P(lt, 31.2 + k * 0.15, 0.9));
          if (au <= 0) return;
          const ex = lerp(sx, hx, 0.68 * au), ey = lerp(sy, hy, 0.68 * au);
          arrow(sx, sy, ex, ey, COL.navy, 2.5, 12);
          // 白い点線が流れる（人の流れ）
          g.save(); g.setLineDash([3, 12]); g.lineDashOffset = -lt * 36; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; g.stroke(); g.restore();
          dot(sx, sy, 4, COL.navy);
        });
        wtext(lt, 30.8, null, wn(HAKATA), hx, hy + 10, { size: 28, w: 800, align: 'center', halo: 6 });
        wtext(lt, 33.0, null, '昼に来る人＝入ってくる人−出ていく人', box.x + box.w / 2, box.y + box.h + 34, { size: 20, c: COL.sub, align: 'center' });
      }, RBOX);

      /* ── 右: ステップ⑤ 計算（灰）と実績（赤）の2本棒 → 倍率 ── */
      phase(lt, 39.0, 46.6, () => {
        const names = ['博多', '中央', '東'], bx = 1000, sc = 560 / 21000;
        wtext(lt, 39.4, null, '計算＝人口から計算した件数、実績＝2024年の出場件数', RX0 + 40, 290, { size: 20, c: COL.sub });
        const hi = win(lt, 45.0, 47.2, 0.4);
        names.forEach((n, k) => {
          const w = ward(n), y = 330 + k * 180, t0 = 39.6 + k * 1.2;
          const calc = w.disp24 / w.fac, actv = w.disp24;
          withAlpha(w === HIGASHI ? 1 : 1 - 0.55 * hi, () => {
            wtext(lt, t0, null, wn(w), RX0 + 40, y + 70, { size: 28, w: 800 });
            const u1 = E.outCubic(P(lt, t0 + 0.2, 0.8)), u2 = E.outCubic(P(lt, t0 + 0.8, 0.8));
            if (u1 > 0) { text('計算', bx - 14, y + 42, { size: 20, c: COL.sub, align: 'right' }); g.fillStyle = COL.grey; g.fillRect(bx, y + 20, calc * sc * u1, 30); }
            if (u2 > 0) { text('実績', bx - 14, y + 92, { size: 20, c: COL.sub, align: 'right' }); g.fillStyle = COL.red; g.fillRect(bx, y + 70, actv * sc * u2, 30); }
            const ex = bx + Math.max(calc, actv) * sc + 24;
            wtext(lt, t0 + 1.5, null, `×${w.fac.toFixed(3)}`, ex, y + 80, { size: 48, tab: true });
          });
        });
      }, RBOX);

      /* ── 右: 実例 東区（縦に数字が並ぶ。左=2025年、右=2035年） ── */
      phase(lt, EX, 60, () => {
        const xL = 820, c25 = 1530, c35 = 1830, T35 = 54.4;
        wtext(lt, EX + 0.4, null, '2025年', c25, 290, { size: 28, align: 'right' });
        wtext(lt, T35, null, '2035年', c35, 290, { size: 28, align: 'right', c: COL.red });
        wtext(lt, EX + 0.4, null, '年齢帯ごとに 人口 × 搬送率', xL, 290, { size: 20, c: COL.sub });
        rule(lt, EX + 0.5, xL, 308, c35 - xL, COL.line, 1);
        AGE.forEach((a, k) => {
          const y = 346 + k * 36, ta = 48.0 + k * 0.12;
          const p25 = HIGASHI.pop['2025'][a], p35 = HIGASHI.pop['2035'][a];
          wtext(lt, ta, null, `${AGEL[a]}　× ${(R[a] * 100).toFixed(2)}%`, xL, y, { size: 20 });
          wtext(lt, ta, null, `${fmt(p25)}人 → ${fmt(p25 * R[a])}人`, c25, y, { size: 20, tab: true, align: 'right' });
          wtext(lt, T35 + k * 0.12, null, `${fmt(p35)}人 → ${fmt(p35 * R[a])}人`, c35, y, { size: 20, tab: true, align: 'right' });
        });
        rule(lt, 49.2, xL, 572, c35 - xL, COL.navy, 1);
        const rows = [
          [49.4, '合計＝1年に運ばれる人の見込み', `${fmt(trOf(HIGASHI, 2025))}人`, `${fmt(trOf(HIGASHI, 2035))}人`],
          [50.2, '＋ 昼間補正（入ってくる人−出ていく人）', `${sgn(dayTr(HIGASHI), 0)}人`, `${sgn(dayTr(HIGASHI), 0)}人`],
          [51.0, '× 出場÷搬送（運ばない出場も数える）', `×${DR.toFixed(3)}`, `×${DR.toFixed(3)}`],
          [51.8, '× 校正係数', `×${HIGASHI.fac.toFixed(3)}`, `×${HIGASHI.fac.toFixed(3)}`],
        ];
        rows.forEach(([ta, l, v25, v35], k) => {
          const y = 614 + k * 50;
          wtext(lt, ta, null, l, xL, y, { size: 20 });
          wtext(lt, ta + 0.2, null, v25, c25, y + 2, { size: 28, tab: true, align: 'right' });
          wtext(lt, T35 + 0.8 + k * 0.2, null, v35, c35, y + 2, { size: 28, tab: true, align: 'right' });
        });
        rule(lt, 52.4, xL, 806, c35 - xL, COL.navy, 2);
        wtext(lt, 52.6, null, '出場件数', xL, 858, { size: 28, w: 800 });
        wtext(lt, 52.8, null, `${fmt(HIGASHI.disp['2025'])}件`, c25, 862, { size: 48, tab: true, align: 'right' });
        wtext(lt, 56.2, null, `${fmt(HIGASHI.disp['2035'])}件`, c35, 862, { size: 48, tab: true, align: 'right', c: COL.red });
      }, RBOX);
    },
  };
})();
