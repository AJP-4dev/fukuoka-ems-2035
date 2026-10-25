/* 第6章 結果③ どこで（見せ場: 3D地図）— 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * 0〜37.6s: 3D（2025 全景 → 中央から縦ワイプで 2025｜2035 の左右分割 → 右の柱が伸びる → 増減率の色
 *            → 分割が閉じて全区のラベル → 都心（博多区・中央区）へ寄る → 引いて全景）
 * 36.6s〜: 2D の小地図2枚（人口の増減｜出場の増減） */
(() => {
  const ntw = (s, size) => [...s].reduce((a, ch) => a + tw(/[0-9]/.test(ch) ? '0' : ch, size, 600, true), 0);   // numText と同じ幅
  /* ── 章専用の定数（すべて DATA から） ── */
  const CORE = ['博多', '中央'];
  const CC = meanC(CORE);
  const L25 = SC.L(2025), L35 = SC.L(2035);
  const pop25 = (w) => popT(w, 2025);
  const per1k = (w) => w.disp['2025'] / pop25(w) * 1000;              // 住民1,000人あたりの出場
  const HK = ward('博多'), CH = ward('中央');
  const OTHERS = WD.filter((w) => !CORE.includes(w.name));
  const pkO = [Math.min(...OTHERS.map(per1k)), Math.max(...OTHERS.map(per1k))];   // 他5区 55〜57
  const dR = [Math.min(...WD.map(wDiff35)), Math.max(...WD.map(wDiff35))];        // +9.8〜+14.7
  const pR = [Math.min(...WD.map(wPopDiff35)), Math.max(...WD.map(wPopDiff35))];  // +0.7〜+4.3
  const e3R = [Math.min(...WD.map((w) => w.pop['2035'].e3 / w.pop['2025'].e3)), Math.max(...WD.map((w) => w.pop['2035'].e3 / w.pop['2025'].e3))];
  const cityPopD = (cityPop(2035) / cityPop(2025) - 1) * 100;          // +2.3
  const cityDispD = (L35 / L25 - 1) * 100;                              // +12.0
  // 増減率の色（3D）: +6%〜+16% を淡い橙→赤に割り当て（全区がプラスなので差が見える幅に）
  const DLO = 6, DHI = 16;
  const dcol = (v) => ramp(['#f6e3cf', '#f4a259', '#e63946'], (v - DLO) / (DHI - DLO));
  // 2D 小地図の共通の物差し（0%〜+16%、人口と出場で同じ）
  const MHI = 16;
  const MOFF = { 中央: [-14, -8], 博多: [16, 0], 城南: [-30, 2], 南: [22, 8] };   // 小地図の数字の位置ずらし（重なり回避）
  const mcol = (v) => ramp(['#eef1f5', '#f4a259', '#e63946'], v / MHI);
  // 増減率の高さ（9.4〜: 色と一緒に高さも増減率へ。+6%→低い、+16%→最大。凡例 +6%〜+16% と同じ幅）
  const hRate = (d) => 0.4 + clamp((d - DLO) / (DHI - DLO)) * 7;
  const colUAt = (lt) => E.inOut(P(lt, 9.4, 0.8));
  // 右（2035）の柱の高さ: 2025→2035 の件数で伸び、9.4〜 増減率の高さへ（以降 3D が消えるまで保持）
  const hR = (w, i, lt) => {
    const u = E.outCubic(P(lt, 6.0 + rankX[i] * 0.06, 1.4));
    return lerp(hOf(lerp(w.disp['2025'], w.disp['2035'], u)), hRate(wDiff35(w)), colUAt(lt));
  };

  /* ── カメラ（すべて t の関数） ── */
  const CF = shiftCam(CAM0, 4.5);                                      // 全画面（左に文字）
  const CS = { ...CAM0, dist: 40 };                                     // 左右分割（同じ角度）
  const CO = shiftCam({ ...CAM0, phi: 0.7, dist: 33, tz: CAM0.tz + 3.6 }, 5.5);   // 分割を閉じた直後（全区ラベル）。やや真上寄りにして城南区の低い柱を見せる
  const CC_ = shiftCam({ theta: -0.22, phi: 0.85, dist: 19, tx: CC[0], tz: CC[1] - 0.6 }, 5);   // 都心に寄る
  const CE = { ...CO };                                                  // 最後の全景

  function camAt(lt) {
    let c;
    if (lt < 14) c = { ...CS };
    else if (lt < 21.4) c = lerpCam(CS, CO, eio(lt, 14, 1.0));
    else if (lt < 33.6) c = lerpCam(CO, CC_, eio(lt, 21.4, 1.8));
    else c = lerpCam(CC_, CE, eio(lt, 33.6, 2.0));
    c.theta += 0.004 * lt;                                              // 常にごくゆっくり回る（静止を作らない）
    return c;
  }

  // 柱の設定（side: 'L' = 2025, 'R' = 2035）
  function setSide(side, lt) {
    const emC = Math.min(E.inOut(P(lt, 21.6, 0.8)), 1 - E.inOut(P(lt, 33.6, 0.8)));
    WD.forEach((w, i) => {
      if (side === 'L') { setPillar(i, hOf(w.disp['2025']), rampDisp(w.disp['2025'])); return; }
      const u = E.outCubic(P(lt, 6.0 + rankX[i] * 0.06, 1.4));
      const v = lerp(w.disp['2025'], w.disp['2035'], u);
      setPillar(i, hR(w, i, lt), rampDisp(v));
      const colU = colUAt(lt);
      if (colU > 0) meshes[i].material.color.lerp(tmpC2.set(dcol(wDiff35(w))), colU);   // RGB で補間（HSL だと青→橙の途中が黄緑になる）
      const focus = CORE.includes(w.name) ? emC : 0;
      const dim = 0.75 * emC * (1 - focus);
      if (dim > 0.001) {                                                // 他を淡い灰へ（不透明のまま）
        meshes[i].material.color.lerp(tmpC2.set('#eef1f5'), dim);
        meshes[i].userData.line.material.opacity = 0.3 * (1 - 0.6 * dim);
      }
      if (focus > 0) meshes[i].userData.line.material.opacity = 0.3 + 0.5 * focus;
    });
    return emC;
  }

  // 3D のラベル（線が走ってから文字がワイプで入る。v>0 でワイプアウト）
  // o.dx, o.dy: 引き出し線の先（画面px）。城南区のように低い柱は横へ引き出す
  function lab3(i, h, l2, c2, u, v, o = {}) {
    if (u <= 0 || v >= 1) return;
    const [x, z] = C3[i]; const [sx, sy] = proj(x, h + 0.05, z);
    const dx = o.dx || 0, dy = o.dy ?? -34, ex = sx + dx, ey = sy + dy;
    const s1 = wn(WD[i]);
    const wl = tw(s1, 28, 800) + (l2 ? 8 + tw(l2, 28, 600, true) : 0);
    const bx = o.left ? ex - 8 - wl : ex + (dx === 0 ? 8 : dx > 0 ? 8 : -8 - wl);
    const ty = dx === 0 ? ey - 6 : ey + 10;
    const lu = E.outCubic(clamp(u / 0.45));
    if (v < 0.5) {
      line(sx, sy, lerp(sx, ex, lu), lerp(sy, ey, lu), COL.navy, 1);
      if (dx !== 0) dot(sx, sy, 3, COL.navy);
    }
    wipe(E.outCubic(clamp((u - 0.3) / 0.7)), bx - 6, ty - 34, wl + 14, 46, () => {
      const w1 = text(s1, bx, ty, { size: 28, w: 800, halo: 6 });
      if (l2) numText(l2, bx + 8 + w1, ty, { size: 28, c: c2, halo: 6 });
    }, v);
  }
  // ラベルの置き方（全景）
  const LPOS = { 東: {}, 博多: { left: false }, 中央: { left: true }, 南: {}, 城南: { dx: -250, dy: 40 }, 早良: { left: true }, 西: { left: true } };

  function draw3D(lt) {
    reset3D(); beginGL();
    const open = eio(lt, 5.0, 0.8), close = eio(lt, 14.0, 1.0);
    // 左（2025）: 全画面 → 左半分 → 閉じる（描くのは右の後）
    const lvw = Math.max(2, lerp(W, W / 2, open));
    const lsw = lerp(lvw, 0, close);
    let emC = 0;
    if (lt >= 5.0) {
      emC = setSide('R', lt);
      const vx = lerp(W / 2, 0, close), vw = W - vx;
      setCam(camAt(lt), vx, vw);
      const sw = lt < 5.8 ? (W / 2) * open : vw;                       // 中央からの縦ワイプ
      renderView(vx, vw, vx, sw);
      // 全区のラベル（分割が閉じた後）
      const ua = P(lt, 15.0, 0.8), va = E.inOut(P(lt, 21.0, 0.35));
      if (ua > 0 && va < 1) WD.forEach((w, i) => lab3(i, hR(w, i, lt), `${sgn(wDiff35(w))}%`, COL.red, ua, va, LPOS[w.name]));
      // 都心のラベル
      const uc = P(lt, 22.8, 0.8), vc = E.inOut(P(lt, 33.4, 0.35));
      if (uc > 0 && vc < 1) {
        lab3(WI['博多'], hR(HK, WI['博多'], lt), `${sgn(wDiff35(HK))}%`, COL.red, uc, vc, {});
        lab3(WI['中央'], hR(CH, WI['中央'], lt), `${sgn(wDiff35(CH))}%`, COL.red, uc, vc, { left: true });
      }
    }
    // 左（2025）は右の後に描く。分割中は右で作った影をそのまま使い、影の計算を1回に減らす（描画時間の節約）
    if (lsw > 1) {
      setSide('L', lt);
      const c = lerpCam(CF, CS, open); c.theta += 0.004 * lt;
      const reuse = lt >= 5.0;
      if (reuse) R.shadowMap.autoUpdate = false;
      setCam(c, 0, lvw); renderView(0, lvw, 0, lsw);
      R.shadowMap.autoUpdate = true;
    }
    // 中央の分割線（縦に走る）
    if (lt >= 5.0 && close < 1) { const lu = E.outCubic(P(lt, 5.0, 0.5)); const x = lerp(W / 2, 0, close); line(x, 130, x, 130 + 760 * lu, COL.navy, 1.5); }

    /* ── 文字 ── */
    // 1.2〜4.6: 2025 全画面
    phase(lt, 1.2, 4.6, () => {
      wtext(lt, 1.3, null, '2025年', LX, 240, { size: 48 });
      wtext(lt, 1.6, null, '柱の高さ＝出場件数\n色が濃いほど多い', LX, 330, { size: 28, lead: 44 });
    }, [0, 150, 790, 300]);
    // 5.4〜14: 分割の見出し
    if (lt >= 5.4 && lt < 14.5) {
      wtext(lt, 5.4, 13.9, '2025年', LX, 200, { size: 48 });
      wtext(lt, 5.6, 13.9, '推計（2024年実績とほぼ同じ）', LX, 244, { size: 20, c: COL.sub });
      wtext(lt, 5.6, 13.9, `${fmt(L25)}件`, W / 2 - 40, 200, { size: 48, tab: true, align: 'right' });
      wtext(lt, 5.8, 13.9, '2035年', W / 2 + 40, 200, { size: 48, c: COL.red });
      wtext(lt, 6.0, 13.9, '人口変化のみ', W / 2 + 40, 244, { size: 20, c: COL.sub });
    }
    // 右上のカウンター（2035年の市全体）
    if (lt >= 5.8 && lt < 21.6) {
      const v = lerp(L25, L35, cnt(lt, 6.0, 1.6));
      wtext(lt, 5.8, 21.2, `${fmt(v)}件`, W - M, 200, { size: 48, c: COL.red, tab: true, align: 'right', halo: 6 });
      if (lt >= 14.6) wtext(lt, 14.6, 21.2, '2035年の市全体', W - M, 244, { size: 20, c: COL.sub, align: 'right', halo: 5 });
    }
    // 凡例（右下・小さく）
    if (lt >= 9.4 && lt < 36.6) {
      const lu = E.outCubic(P(lt, 9.4, 0.6)), x0 = W - M - 300, y0 = 846;
      wipe(lu, x0 - 6, y0 - 34, 312, 84, () => {
        text('色と高さ＝2025年比の増減率', x0, y0 - 12, { size: 20, c: COL.sub, halo: 5 });
        for (let k = 0; k < 30; k++) { g.fillStyle = dcol(DLO + ((DHI - DLO) * k) / 29); g.fillRect(x0 + k * 10, y0, 10, 12); }
        text(`+${DLO}%`, x0, y0 + 36, { size: 20, num: true, c: COL.sub, halo: 5 });
        text(`+${DHI}%`, x0 + 300, y0 + 36, { size: 20, num: true, c: COL.sub, align: 'right', halo: 5 });
      });
    }
    // 全区（15〜21）
    phase(lt, 15.2, 21.2, () => {
      wtext(lt, 15.3, null, '2035年の出場', LX, 240, { size: 48 });
      wtext(lt, 15.6, null, `どの区も ${sgn(dR[0])}〜${sgn(dR[1])}%\n最も増えるのは${wn(CH)}`, LX, 330, { size: 28, lead: 44 });
      rule(lt, 17.4, LX, 400, tw(`最も増えるのは${wn(CH)}`, 28), COL.red, 2, 1.0);
    }, [0, 150, 790, 300]);
    // 都心（22〜33.6）
    phase(lt, 22.4, 33.4, () => {
      wtext(lt, 22.5, null, '都心', LX, 240, { size: 48 });
      wtext(lt, 22.8, null, '昼に通勤・買い物で来る人も\n倒れ、運ばれる', LX, 330, { size: 28, lead: 44 });
    }, [0, 150, 790, 300]);
    const cp = (f, d) => `${wn(HK)} ${f(HK).toFixed(d)}、${wn(CH)} ${f(CH).toFixed(d)}`;
    chip(lt, 24.0, 33.4, `住民1,000人あたり ${cp(per1k, 0)}（他5区 ${Math.round(pkO[0])}〜${Math.round(pkO[1])}）`, LX, 470, { c: COL.red });
    chip(lt, 26.4, 33.4, `昼夜間人口比 ${cp((w) => w.dn, 2)}`, LX, 522, { c: COL.navy });
    chip(lt, 28.8, 33.4, `校正係数 ${cp((w) => w.fac, 2)}`, LX, 574, { c: COL.purple });
  }

  function draw2D(lt) {
    bgWipe(lt, 36.6, 0.9);                                              // 3D → 2D（背景が左→右に覆う）
    if (lt < 37.5) return;
    wtext(lt, 37.8, null, '人口と救急の増減', LX, 240, { size: 48 });
    wtext(lt, 38.2, null, '2025→2035年、同じ色の物差し', LX, 300, { size: 20, c: COL.sub });
    wtext(lt, 39.4, null, '人口（市全体）', LX, 420, { size: 28, c: COL.sub });
    wtext(lt, 39.6, null, `${sgn(cityPopD * cnt(lt, 39.8, 1.2))}%`, LX, 540, { size: 120, w: 600, tab: true, c: COL.navy });
    wtext(lt, 41.4, null, '出場（人口変化のみ）', LX, 640, { size: 28, c: COL.sub });
    wtext(lt, 41.6, null, `${sgn(cityDispD * cnt(lt, 41.8, 1.2))}%`, LX, 760, { size: 120, w: 600, tab: true, c: COL.red });
    rule(lt, 52.4, LX, 792, ntw(`${sgn(cityDispD)}%`, 120), COL.red, 4, 1.4);

    const boxes = [{ x: 830, y: 250, w: 480, h: 500 }, { x: 1360, y: 250, w: 480, h: 500 }];
    const vals = [(w) => wPopDiff35(w), (w) => wDiff35(w)];
    const titles = ['人口の増減', '出場の増減'];
    boxes.forEach((b, m) => {
      const t0 = 38.0 + m * 1.0;
      wtext(lt, t0, null, titles[m], b.x, 210, { size: 28, c: m ? COL.red : COL.navy });
      const u = E.outCubic(P(lt, t0 + 0.2, 1.2));
      wipe(u, b.x - 10, b.y - 10, b.w + 20, b.h + 20, () => {
        const xf = drawMap(b, (w) => mcol(vals[m](w)));
        // 区ごとの値（1秒以内に全部）
        const la = E.outCubic(P(lt, 43.0 + m * 1.6, 0.6));
        if (la > 0) WD.forEach((w) => {
          const [cx0, cy0] = wardC(xf, w), off = MOFF[w.name] || [0, 0], cx = cx0 + off[0], cy = cy0 + off[1];
          wipe(la, cx - 50, cy - 20, 100, 36, () => text(`${sgn(vals[m](w))}%`, cx, cy + 7, { size: 20, num: true, align: 'center', halo: 5, c: COL.ink }));
        });
      });
    });
    chip(lt, 47.2, 54.6, `人口 ${sgn(pR[0])}〜${sgn(pR[1])}%`, 830, 790, { c: COL.navy });
    chip(lt, 49.0, 54.6, `85歳以上 ×${e3R[0].toFixed(2)}〜${e3R[1].toFixed(2)}`, 1080, 790, { c: COL.purple });
    chip(lt, 50.8, 54.6, `出場 ${sgn(dR[0])}〜${sgn(dR[1])}%`, 1360, 790, { c: COL.red });
    // 共通の凡例（右下）
    const lu = E.outCubic(P(lt, 40.0, 0.6)), x0 = W - M - 320, y0 = 864;
    wipe(lu, x0 - 6, y0 - 30, 332, 34, () => {
      for (let q = 0; q < 32; q++) { g.fillStyle = mcol((MHI * q) / 31); g.fillRect(x0 + 40 + q * 6.5, y0 - 16, 6.5, 12); }
      text('0%', x0, y0 - 4, { size: 20, num: true, c: COL.sub });
      text(`+${MHI}%`, x0 + 320, y0 - 4, { size: 20, num: true, c: COL.sub, align: 'right' });
    });
  }

  window.CHAPTERS[6] = {
    title: '結果③ どこで',
    q: '増えるのは、どこ？',
    concl: null,
    duration: 55,
    subs: [
      [1.6, 4.8, '柱の高さ＝区ごとの出場件数'],
      [5.4, 9.0, '2035年、どの区も柱が伸びる'],
      [9.4, 14.4, '色と高さ＝2025年からの増減率'],
      [15.0, 21.0, 'どの区も +10〜15%'],
      [22.0, 33.4, '都心は“住んでいない人”が運ばれる'],
      [34.0, 37.8, '引いて見ると、どの区も増える'],
      [38.4, 45.4, '左＝人口、右＝出場。同じ物差し'],
      [45.8, 54.6, '人口が少し増えるだけでも、救急は1割増える'],
    ],
    uses3D: (lt) => lt >= 0.9 && lt < 37.6,   // 問いカードが覆っている間は 2D のみ（0.9〜1.2 でカードが抜けるのに合わせて 3D が見える）
    setup(ctx) {},
    draw(ctx, lt, t) {
      if (lt >= 0.9 && lt < 37.6) draw3D(lt);
      if (lt >= 36.6) draw2D(lt);
    },
  };
})();
