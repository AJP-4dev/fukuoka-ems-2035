/* 第10章 長期と示唆（30秒）— 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * (a) 1.4–14.6  2025→2050 の2本の線（2025年＝100）: 人口（紺、2040年がピークで減る）と出場の下限（赤、減らない）が同時に走る
 * (b) 15.0–22.6 示唆3行（増隊の目安づくり／昼間人口を考慮した配置／適正利用の啓発）がワイプで入る → 番号が順に赤くなる
 * (c) 23.0–30   3D地図（2035年の柱、薄く）の上にロックアップ → 白へ静かに止める（最後の0.5秒は静止）。URL は出さない */
(() => {
  const popI = (y) => cityPop(y) / cityPop(2025) * 100;
  const dspI = (y) => SC.L(y) / SC.L(2025) * 100;
  const PEAK = YEARS.reduce((a, y) => (cityPop(y) > cityPop(a) ? y : a), 2025);   // 2040
  const old75 = (y) => cityPop(y, 'e2') + cityPop(y, 'e3');
  const SU = (y) => STD.units[yk(y)];
  const HB = ward('博多'), CH = ward('中央');
  const IDEAS = [
    ['増隊の目安づくり', `整備指針の基準は2035年に${SU(2035)}隊（現行${STD.current}隊）`],
    ['昼間人口を考慮した配置', `${wn(HB)}と${wn(CH)}は昼に人が集まる（昼夜間比 ${HB.dn.toFixed(2)}／${CH.dn.toFixed(2)}）`],
    ['適正利用の啓発', '救急車を呼ぶか迷ったときの相談先を知ってもらう'],
  ];
  const IT = (k) => 15.6 + k * 1.0;                      // 各行の出る時刻
  const T_ALL = 18.6;                                    // 3行そろった後、番号が順に赤くなる
  const T3 = 23.0, TEND = 29.5;
  const SRC = '出典: 福岡市の公表資料などから再計算。市の公式見解ではありません';

  window.CHAPTERS[10] = {
    title: '長期と示唆',
    q: '2050年まで見ると？',
    concl: null,
    duration: 30,
    subs: [
      [1.6, 8.8, '人口が減っても、救急は減らない'],
      [9.2, 14.4, '増えるのは75歳以上'],
      [15.4, 22.4, '数字から見える3つの備え'],
      [23.6, 29.6, '備えは、数字から'],
    ],
    uses3D: (lt) => lt >= T3,
    setup(ctx) {},
    draw(ctx, lt, t) {
      /* ── (a) 2025→2050 の2本の線 ───────────────── */
      phase(lt, 1.4, 14.6, () => {
        const C = { x0: 900, x1: 1600, y0: 220, y1: 760 };
        C.X = (y) => lerp(C.x0, C.x1, (y - 2025) / 25);
        C.Y = (v) => lerp(C.y1, C.y0, (v - 95) / 30);
        axes(lt, 1.4, C, [[2025, '2025'], [2030, '2030'], [2040, '2040'], [2050, '2050']], [[100, '100'], [110, '110'], [120, '120']]);
        wtext(lt, 1.8, null, '2025年＝100', C.x0, 190, { size: 20, c: COL.sub });
        const pp = YEARS.map((y) => [C.X(y), C.Y(popI(y))]);
        const dp = YEARS.map((y) => [C.X(y), C.Y(dspI(y))]);
        const u = E.inOut(P(lt, 1.8, 3.0));
        const ep = polyline(pp, u, COL.navy, 3.5), ed = polyline(dp, u, COL.red, 4);
        const br = lt >= 10.0 ? 1.5 * Math.sin((lt - 10.0) * Math.PI * 0.9) : 0;
        if (ep && u < 1) dot(ep[0], ep[1], 6, COL.navy);
        if (ed && u < 1) dot(ed[0], ed[1], 6, COL.red);
        // ピーク（2040年）
        const tPk = 1.8 + 3.0 * 0.62;
        if (lt >= tPk) {
          const p = pp[PEAK - 2025];
          dot(p[0], p[1], 7, '#ffffff', COL.navy);
          wtext(lt, tPk, null, `${PEAK}年 ${man(cityPop(PEAK))}（ピーク）`, p[0], p[1] - 22, { size: 20, c: COL.navy, align: 'center' });
        }
        // 終点のラベル
        if (u >= 1) {
          dot(pp[25][0], pp[25][1], 6 + br, COL.navy);
          dot(dp[25][0], dp[25][1], 6 + br, COL.red);
        }
        wtext(lt, 4.9, null, `人口 ${man(cityPop(2050))}`, pp[25][0] + 16, pp[25][1] + 8, { size: 20, c: COL.navy });
        wtext(lt, 5.0, null, `出場 ${fmt(SC.L(2050))}件`, dp[25][0] + 16, dp[25][1] + 8, { size: 20, c: COL.red });
        // 左カラム
        wtext(lt, 1.6, null, '2050年までの人口と救急', LX, 240, { size: 48 });
        wtext(lt, 1.9, null, '2025年を100として比べる\n救急は人口変化のみの場合（下限）', LX, 330, { size: 28, lead: 44 });
      }, [0, 130, W, 790]);
      chip(lt, 6.0, 14.6, `人口は${PEAK}年 ${man(cityPop(PEAK))}がピーク`, LX, 470, { c: COL.navy });
      chip(lt, 7.0, 14.6, `出場は2050年 ${fmt(SC.L(2050))}件、減らない`, LX, 522, { c: COL.red });
      chip(lt, 9.6, 14.6, `75歳以上 ${man(old75(2025))}→${man(old75(2050))}人（2050年）`, LX, 574, { c: AGEC.e2 });

      /* ── (b) 示唆3行 ───────────────────────────── */
      phase(lt, 15.0, 22.6, () => {
        wtext(lt, 15.2, null, '数字から見える備え', LX, 220, { size: 28, c: COL.sub });
        const act = Math.floor((lt - T_ALL) / 1.3) % 3;
        IDEAS.forEach(([t1, t2], k) => {
          const t0 = IT(k), y = 360 + k * 170;
          const on = lt < T_ALL || act === k;
          wtext(lt, t0, null, `${k + 1}`, LX, y, { size: 48, tab: true, c: on ? COL.red : COL.faint });
          wtext(lt, t0 + 0.1, null, t1, LX + 70, y, { size: 48, c: COL.ink });
          wtext(lt, t0 + 0.3, null, t2, LX + 70, y + 50, { size: 28, c: COL.sub });
          rule(lt, t0 + 0.2, LX, y + 88, RX1 - LX, COL.line, 1, 0.8);
        });
      }, [0, 130, W, 790]);

      /* ── (c) 3D地図の上にロックアップ → 白で静かに止める ── */
      if (lt >= T3) {
        const lq = Math.min(lt, TEND);
        reset3D(); beginGL();
        WD.forEach((w, i) => setPillar(i, hOf(w.disp['2035']), divCol(wDiff35(w))));
        setCam(shiftCam({ ...CAM0, theta: CAM0.theta + 0.012 * (lq - T3), dist: 44 }, 21)); renderView(0, W);
        // 地図を薄くする（0.62）→ 終盤は白へ
        const wu = E.inOut(P(lq, T3 + 3.2, 3.0));
        g.fillStyle = mix('#f4f6f9', '#ffffff', wu);
        g.globalAlpha = lerp(0.62, 1, wu); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
        // 背景色の板が右へ抜けて地図が現れる
        clipRect(W * E.inOut(P(lt, T3, 0.6)), 0, W, H, () => { g.fillStyle = COL.bg; g.fillRect(0, 0, W, H); });
        drawLockup(lq - (T3 + 0.3), M, 560);
        wtext(lq, T3 + 2.2, null, SRC, M, 680, { size: 20, c: COL.sub });
      }
    },
  };
})();
