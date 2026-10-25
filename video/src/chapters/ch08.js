/* 第8章 隊の負担（40秒）— 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * (a) 1.4–20.4  区別の1隊あたり出場（2024実績）の横棒が伸びる（長い順。年報の市平均を超える区は赤、縦の目安線は使わない）
 *               → チップ3つ → 9.6〜 市平均を超える3区の行に淡い帯が順に走る（静止対策）
 * (b) 20.8–39.6 救急隊の数: 実績 2013–2024（紺）→ 現行34隊の水平線 → 整備指針の基準（赤の階段）が 2050 まで走り、
 *               左の大きな数字が 35 → 39 → 42 と数える（見せる動きはこの線） */
(() => {
  const AVG = 2968;                                               // 年報の市平均（1隊あたり、2024）
  const ROWS = WD.map((w, i) => i).sort((a, b) => WD[b].loadPerUnit24 - WD[a].loadPerUnit24);
  const OVER = ROWS.filter((i) => WD[i].loadPerUnit24 > AVG);    // 南・早良・中央
  const MIN = WD[ROWS[ROWS.length - 1]];                          // 城南区
  const MAXW = WD[ROWS[0]];                                       // 南区
  const CUR = STD.current;                                        // 34
  const SU = (y) => STD.units[yk(y)];
  const T_B = 20.8, L0 = 22.8, L1 = 33.8;                          // (b) 基準の線が走る区間
  const yrAt = (lt) => Math.min(2050, Math.floor(lerp(2025, 2051, E.inOut(P(lt, L0, L1 - L0)))));

  window.CHAPTERS[8] = {
    title: '隊の負担',
    q: '救急隊は足りる？',
    concl: null,
    duration: 40,
    subs: [
      [1.6, 8.8, `${wn(MAXW)}は1隊が年3,800件`],
      [9.2, 20.2, '区の出場を、救急隊の数で割る'],
      [21.2, 29.6, `基準では、今すでに${SU(2025) - CUR}隊足りない`],
      [30.0, 39.6, `2035年には${SU(2035) - CUR}隊足りない`],
    ],
    setup(ctx) {},
    draw(ctx, lt, t) {
      /* ── (a) 区別の1隊あたり（横棒） ────────────── */
      phase(lt, 1.4, 20.4, () => {
        const XN = 1010, X0 = 1030, SCL = 640 / 4000, BH = 40, rowY = (k) => 232 + k * 84;
        // 凡例（縦の目安線の代わりに色で示す）
        wipe(E.outCubic(P(lt, 1.8, 0.5)), X0 - 4, 166, 760, 36, () => {
          g.fillStyle = COL.red; g.fillRect(X0, 176, 18, 18);
          let x = X0 + 26 + text(`年報の市平均 ${fmt(AVG)}件を超える`, X0 + 26, 192, { size: 20, c: COL.sub }) + 28;
          g.fillStyle = COL.navy; g.fillRect(x, 176, 18, 18);
          text('市平均以下', x + 26, 192, { size: 20, c: COL.sub });
        });
        // 9.6〜: 市平均を超える3区の行に淡い帯が順に走る（2.4秒周期）
        if (lt >= 9.6) {
          const k = Math.floor((lt - 9.6) / 2.4) % OVER.length, p = ((lt - 9.6) % 2.4) / 2.4;
          const r = ROWS.indexOf(OVER[k]), u = E.outCubic(clamp(p / 0.4)), v = E.inOut(clamp((p - 0.7) / 0.3));
          const x0 = XN - 130, wAll = RX1 - x0 + 20;
          if (u > v) { g.fillStyle = 'rgba(230,57,70,0.08)'; g.fillRect(x0 + wAll * v, rowY(r) - 18, wAll * (u - v), BH + 36); }
        }
        ROWS.forEach((i, k) => {
          const w = WD[i], v = w.loadPerUnit24, over = v > AVG, y = rowY(k);
          const u = E.outCubic(P(lt, 2.2 + k * 0.08, 1.0));
          wtext(lt, 2.0 + k * 0.05, null, wn(w), XN, y + BH / 2 + 10, { size: 28, align: 'right', c: over ? COL.ink : COL.sub });
          if (u <= 0) return;
          g.fillStyle = over ? COL.red : COL.navy; g.fillRect(X0, y, v * SCL * u, BH);
          if (u > 0.9) {
            const ex = X0 + v * SCL + 14;
            const wv = numText(`${fmt(v)}件`, ex, y + BH / 2 + 10, { size: 28, c: over ? COL.red : COL.ink });
            text(`${units(w)}隊`, ex + wv + 14, y + BH / 2 + 8, { size: 20, c: COL.sub });
          }
        });
        // 左カラム
        wtext(lt, 1.6, null, '1隊あたりの出場', LX, 240, { size: 48 });
        wtext(lt, 1.9, null, '2024年の実績\n区の出場 ÷ 区の救急隊の数', LX, 330, { size: 28, lead: 44 });
      }, [0, 130, W, 790]);
      chip(lt, 4.4, 20.4, `${wn(MAXW)} ${fmt(MAXW.loadPerUnit24)}件、${units(MAXW)}隊で受け持つ`, LX, 470, { c: COL.red });
      chip(lt, 6.4, 20.4, `年報の市平均 ${fmt(AVG)}件`, LX, 522, { c: COL.navy });
      chip(lt, 8.0, 20.4, `${wn(MIN)} ${fmt(MIN.loadPerUnit24)}件（最も少ない）`, LX, 574, { c: COL.navy });

      /* ── (b) 救急隊の数: 実績と整備指針の基準 ───── */
      if (lt >= T_B) {
        const C = { x0: 960, x1: 1700, y0: 220, y1: 760 };
        C.X = (y) => lerp(C.x0, C.x1, (y - 2013) / 37);
        C.Y = (v) => lerp(C.y1, C.y0, (v - 25) / 20);
        axes(lt, T_B, C, [[2013, '2013'], [2024, '2024'], [2035, '2035'], [2050, '2050']], [[25, '25隊'], [30, '30隊'], [35, '35隊'], [40, '40隊'], [45, '45隊']]);
        wtext(lt, T_B + 0.3, null, '救急隊の数（年度末）', C.x0, 168, { size: 20, c: COL.sub });
        // 実績 2013–2024（紺）
        const act = []; for (let y = 2013; y <= 2024; y++) act.push([C.X(y), C.Y(SER.units[yk(y)])]);
        polyline(act, E.inOut(P(lt, T_B + 0.5, 1.2)), COL.navy, 3.5);
        if (lt >= T_B + 1.7) {
          dot(act[0][0], act[0][1], 5, COL.navy);
          numText(`${SER.units['2013']}隊`, act[0][0] + 10, act[0][1] + 32, { size: 20, c: COL.sub });
        }
        // 現行 34 隊の水平線（2024 → 2050、点線）
        const cu = E.outCubic(P(lt, 21.8, 0.9)), cy = C.Y(CUR);
        if (cu > 0) line(C.X(2024), cy, lerp(C.X(2024), C.X(2050), cu), cy, COL.navy, 2, [8, 6]);
        wtext(lt, 22.4, null, `現行 ${CUR}隊`, C.X(2050) + 12, cy + 7, { size: 20, c: COL.navy });
        // 基準（赤の階段）: 2025 → 2050 を走る。差は淡い赤
        const steps = []; for (let y = 2025; y <= 2050; y++) { steps.push([C.X(y), C.Y(SU(y))]); steps.push([C.X(y + 1 > 2050 ? 2050.6 : y + 1), C.Y(SU(y))]); }
        const su = E.inOut(P(lt, L0, L1 - L0));
        if (su > 0) {
          const xe = lerp(C.X(2025), C.X(2050.6), su);
          clipRect(C.X(2025), C.y0, xe - C.X(2025), C.y1 - C.y0, () => {
            g.beginPath(); g.moveTo(C.X(2025), cy); steps.forEach((p) => g.lineTo(p[0], p[1])); g.lineTo(C.X(2050.6), cy); g.closePath();
            g.fillStyle = 'rgba(230,57,70,0.12)'; g.fill();
          });
          const e = polyline(steps, su, COL.red, 3.5);
          if (e && su < 1) dot(e[0], e[1], 6, COL.red);
        }
        // 2025・2035・2050 の基準値（線が届いたら）
        const br = lt >= L1 ? 1.5 * Math.sin((lt - L1) * Math.PI * 0.9) : 0;
        [2025, 2035, 2050].forEach((y) => {
          const tt = L0 + (L1 - L0) * ((y - 2025) / 25.6);
          if (lt < tt) return;
          const x = y === 2050 ? C.X(2050.6) : C.X(y), py = C.Y(SU(y));
          dot(x, py, 7 + (y === 2050 ? br : 0), COL.red);
          const al = y === 2025 ? 'right' : y === 2050 ? 'right' : 'center', dx = y === 2025 ? -14 : 0, dy = y === 2025 ? 10 : -20;
          wtext(lt, tt, null, `${SU(y)}隊`, x + dx, py + dy, { size: 28, tab: true, c: COL.red, align: al });
        });
        // 左カラム: 見出し・大きな数字（線の先端の年の基準隊数）
        wtext(lt, T_B + 0.4, null, '必要な救急隊の数', LX, 240, { size: 48 });
        wtext(lt, T_B + 0.7, null, '国の整備指針の計算式で\n人口から出した基準', LX, 330, { size: 28, lead: 44 });
        if (lt >= L0) {
          const yr = yrAt(lt);
          wipe(E.outCubic(P(lt, L0, 0.5)), LX - 6, 440, LW, 150, () => {
            const wv = numText(`${SU(yr)}`, LX, 560, { size: 120, c: COL.red });
            text('隊', LX + wv + 8, 560, { size: 48, w: 800, c: COL.red });
            numText(`${yr}年の基準`, LX + wv + 70, 560, { size: 28, c: COL.sub });
          });
        }
        chip(lt, 24.2, 39.8, `2025年 基準${SU(2025)}隊、現行${CUR}隊`, LX, 640, { c: COL.red });
        chip(lt, 29.0, 39.8, `2035年 基準${SU(2035)}隊（あと${SU(2035) - CUR}隊）`, LX, 692, { c: COL.red });
        chip(lt, 34.0, 39.8, `救急隊は2013年の${SER.units['2013']}隊から、いま${CUR}隊`, LX, 744, { c: COL.navy });
      }
    },
  };
})();
