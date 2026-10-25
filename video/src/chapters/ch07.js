/* 第7章 妥当性（40秒）— 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * (a) 1.4–20.6  答え合わせ: 2013–2024 の実績（赤）が走る → 2013–2019 の傾き（紺の点線）が 2024 まで伸びる
 *               → 実績が上に抜けた差が薄赤で開く → 2022／2023／2024 の差をチップで（1秒以内に3つ）→「上限」の説明
 * (b) 21.0–39.6 全国／横浜／福岡の高齢者内の比率（人口1,000人あたり）の棒 3×3 が伸びる → チップ → 年齢帯ごとに淡い帯が順に走る */
(() => {
  const S = SER.dispatch, BT = TR.backtest;
  const YR = []; for (let y = 2013; y <= 2024; y++) YR.push(y);
  const FX = [], FY = []; for (let y = BT.fitYears[0]; y <= BT.fitYears[1]; y++) { FX.push(y); FY.push(S[yk(y)]); }
  const [FA, FB] = fit(FX, FY);
  // 点線: 2013–2021 は 2013–2019 の傾き、2022–2024 は答え合わせの予測値（DATA.trend.backtest.pred）
  const predY = (y) => (BT.pred[yk(y)] != null ? BT.pred[yk(y)] : FA + FB * y);
  // 2021→2022 で実績が予測線を上に抜ける点（帯の始まり）
  const X_CROSS = (() => { const a0 = S['2021'] - predY(2021), a1 = S['2022'] - predY(2022); return 2021 + a0 / (a0 - a1); })();
  const V_CROSS = lerp(predY(2021), predY(2022), X_CROSS - 2021);
  const ERR = [2022, 2023, 2024].map((y) => [y, BT.errPct[yk(y)]]);
  const errAbs = ERR.map(([, e]) => Math.abs(e));
  const E_LO = Math.round(Math.min(...errAbs)), E_HI = Math.round(Math.max(...errAbs));   // 7〜9%
  // (b) 高齢者内の比率（人口1,000人あたり）。全国・横浜は SPEC の確定値、福岡は DATA.rates
  const GRP = ['e1', 'e2', 'e3'];
  const SERIES = [
    { name: '全国', c: COL.grey, v: { e1: 59.5, e2: 120.1, e3: 248.9 }, d: 1 },
    { name: '横浜', c: '#7fa6d6', v: { e1: 63, e2: 123, e3: 248 }, d: 0 },
    { name: '福岡', c: COL.navy, v: { e1: DATA.rates.e1 * 1000, e2: DATA.rates.e2 * 1000, e3: DATA.rates.e3 * 1000 }, d: 1 },
  ];
  const T_B = 21.0;

  window.CHAPTERS[7] = {
    title: '妥当性',
    q: 'この推計は、当たる？',
    concl: null,
    duration: 40,
    subs: [
      [1.6, 9.6, `コロナ前の傾きでは${E_LO}〜${E_HI}%低く出る`],
      [10.0, 20.4, 'だから“上限”も置いた'],
      [21.6, 30.0, '年齢別の運ばれ方を、ほかと比べる'],
      [30.4, 39.6, '年を取るほど運ばれる形は、どこでも同じ'],
    ],
    setup(ctx) {},
    draw(ctx, lt, t) {
      /* ── (a) 答え合わせ ───────────────────────── */
      phase(lt, 1.4, 20.6, () => {
        const C = { x0: 900, x1: 1740, y0: 200, y1: 780 };
        C.X = (y) => lerp(C.x0, C.x1, (y - 2013) / 11);
        C.Y = (v) => lerp(C.y1, C.y0, (v - 60000) / 45000);
        axes(lt, 1.4, C, [[2013, '2013'], [2016, '2016'], [2019, '2019'], [2022, '2022'], [2024, '2024']],
          [[60000, '6万件'], [70000, '7万件'], [80000, '8万件'], [90000, '9万件'], [100000, '10万件']]);
        wtext(lt, 1.8, null, '市全体の救急出場（1年）', C.x0, 168, { size: 20, c: COL.sub });
        const act = YR.map((y) => [C.X(y), C.Y(S[yk(y)])]);
        const prd = YR.map((y) => [C.X(y), C.Y(predY(y))]);
        // 実績が予測を上に抜けた後の差（薄赤の帯）: 交点から 2024 まで左→右に開く
        const gu = E.outCubic(P(lt, 7.0, 1.0));
        if (gu > 0) {
          const xa = C.X(X_CROSS), xb = C.X(2024);
          clipRect(xa, C.y0, (xb - xa) * gu, C.y1 - C.y0, () => {
            g.beginPath(); g.moveTo(C.X(X_CROSS), C.Y(V_CROSS));
            for (let y = 2022; y <= 2024; y++) g.lineTo(C.X(y), C.Y(S[yk(y)]));
            for (let y = 2024; y >= 2022; y--) g.lineTo(C.X(y), C.Y(predY(y)));
            g.closePath(); g.fillStyle = 'rgba(230,57,70,0.14)'; g.fill();
          });
        }
        // 実績（赤）→ 傾き（紺の点線）
        const au = E.inOut(P(lt, 1.8, 2.4));
        const ae = polyline(act, au, COL.red, 4);
        if (ae && au < 1) dot(ae[0], ae[1], 6, COL.red);
        polyline(prd.slice(0, 7), E.inOut(P(lt, 4.4, 1.0)), COL.navy, 3, [10, 8]);
        polyline(prd.slice(6), E.inOut(P(lt, 5.4, 1.2)), COL.navy, 3, [10, 8]);
        wtext(lt, 4.6, null, '実績', act[11][0] + 14, act[11][1] + 7, { size: 20, c: COL.red });
        wtext(lt, 5.0, null, '2013〜2019年の傾き', C.X(2016.4), C.Y(predY(2016.4)) + 48, { size: 20, c: COL.navy, align: 'center' });
        // 答え合わせの3点（予測の点と実績の点）。8.4〜 小さく呼吸
        const br = lt >= 9.6 ? 2 * Math.sin((lt - 9.6) * Math.PI * 0.8) : 0;
        ERR.forEach(([y], k) => {
          const u = E.outBack(P(lt, 8.0 + k * 0.15, 0.4));
          if (u <= 0) return;
          const r = clamp(u, 0, 1.3);
          dot(C.X(y), C.Y(predY(y)), (6 + br) * r, '#ffffff', COL.navy);
          dot(C.X(y), C.Y(S[yk(y)]), (6 + br) * r, COL.red);
        });
        wtext(lt, 7.4, null, 'コロナ禍のあと、実績が上に外れた', C.X(2021.4), C.Y(99000), { size: 20, c: COL.sub, align: 'right' });
        wtext(lt, 16.0, null, '上に外れた分を、上限の伸びに', C.X(2021.4), C.Y(99000) + 32, { size: 20, c: COL.red, align: 'right' });
        // 左カラム
        wtext(lt, 1.6, null, '答え合わせ', LX, 240, { size: 48 });
        wtext(lt, 1.9, null, '2013〜2019年の傾きで\n2022〜2024年を当ててみる', LX, 330, { size: 28, lead: 44 });
      }, [0, 130, W, 790]);
      ERR.forEach(([y, e], k) => chip(lt, 8.0 + k * 0.3, 12.6, `${y}年 予測は実績の ${sgn(e)}%`, LX, 470 + k * 52, { c: COL.red }));
      chip(lt, 13.0, 20.6, `上限＝コロナ後の伸び 年${(TR.slopeAll * 100).toFixed(1)}%`, LX, 470, { c: COL.red });
      chip(lt, 14.0, 20.6, `中間＝コロナ前の伸び 年${(TR.slopePre * 100).toFixed(1)}%`, LX, 522, { c: COL.orange });
      chip(lt, 15.0, 20.6, '下限＝人口の変化だけ', LX, 574, { c: COL.navy });

      /* ── (b) 高齢者内の比率（全国／横浜／福岡） ─── */
      if (lt >= T_B) {
        const C = { x0: 960, x1: 1760, y0: 200, y1: 780 };
        C.Y = (v) => lerp(C.y1, C.y0, v / 320);
        const GW = (C.x1 - C.x0) / 3, BW = 58, GAP = 10;
        const gx = (k) => C.x0 + GW * k + GW / 2;                     // 群の中心
        const bx = (k, s) => gx(k) + (s - 1) * (BW + GAP) - BW / 2;  // 棒の左端
        axes(lt, T_B, C, [], [[0, '0'], [100, '100人'], [200, '200人'], [300, '300人']]);
        wtext(lt, T_B + 0.3, null, '人口1,000人あたり、1年に救急車で運ばれる人', C.x0, 168, { size: 20, c: COL.sub });
        GRP.forEach((a, k) => wtext(lt, T_B + 0.4, null, AGEL[a], gx(k), C.y1 + 36, { size: 20, c: COL.ink, align: 'center' }));
        // 26.0〜: 年齢帯ごとに淡い帯が順に走る（静止を避ける小さな動き。2.4秒周期）
        if (lt >= 26.0) {
          const k = Math.floor((lt - 26.0) / 2.4) % 3, p = ((lt - 26.0) % 2.4) / 2.4;
          const u = E.outCubic(clamp(p / 0.35)), v = E.inOut(clamp((p - 0.72) / 0.28));
          const x0 = gx(k) - GW / 2 + 8, wAll = GW - 16;
          if (u > v) {
            g.fillStyle = 'rgba(20,33,61,0.06)'; g.fillRect(x0 + wAll * v, C.y0, wAll * (u - v), C.y1 - C.y0);
            line(x0 + wAll * v, C.y1 + 50, x0 + wAll * u, C.y1 + 50, COL.red, 2);
          }
        }
        // 棒: 9本が 1.2 秒以内に伸びる。値は棒の上に
        SERIES.forEach((s, si) => GRP.forEach((a, k) => {
          const u = E.outCubic(P(lt, T_B + 0.8 + (k * 3 + si) * 0.05, 0.9));
          if (u <= 0) return;
          const v = s.v[a], x = bx(k, si), yt = C.Y(v * u);
          g.fillStyle = s.c; g.fillRect(x, yt, BW, C.y1 - yt);
          if (u > 0.95) text(v.toFixed(s.d), x + BW / 2, C.Y(v) - 10, { size: 20, num: true, c: si === 2 ? COL.ink : COL.sub, align: 'center' });
        }));
        // 凡例
        wipe(E.outCubic(P(lt, T_B + 0.6, 0.5)), C.x0 - 4, 216, 560, 36, () => {
          let x = C.x0 + 10;
          SERIES.forEach((s) => { g.fillStyle = s.c; g.fillRect(x, 224, 18, 18); x += 26 + text(s.name, x + 26, 240, { size: 20, c: COL.ink }) + 28; });
        });
        // 左カラム
        wtext(lt, T_B + 0.4, null, '年齢別の運ばれ方', LX, 240, { size: 48 });
        wtext(lt, T_B + 0.7, null, '65歳以上を3つに分けて\n人口1,000人あたりで比べる', LX, 330, { size: 28, lead: 44 });
        chip(lt, 26.0, 39.8, '3地域とも、年齢が上がるほど高い', LX, 470, { c: COL.navy });
        chip(lt, 32.0, 39.8, '福岡の65歳以上全体 135.8（全国 118.2）', LX, 522, { c: COL.red });
        chip(lt, 34.4, 39.8, '数の水準は違っても、形は同じ', LX, 574, { c: COL.navy });
      }
    },
  };
})();
