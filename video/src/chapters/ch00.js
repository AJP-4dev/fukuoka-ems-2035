/* 第0章 冒頭（8秒）— 福岡版スタブ兼 CAM0 の確認用。契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
   SPEC: 0–2.5 7区の輪郭が線で描かれる（中央区→博多区→同心円）／2.5–5.5 柱が立ち上がる（区ごとに0.12sずらし）／
   5.5–8.0 タイトルのロックアップ。カウンターは出さない（数字は字幕で）。 */
(() => {
  window.CHAPTERS[0] = {
    title: '冒頭', q: null, concl: null, duration: 8,
    subs: [[0.6, 4.0, '2024年、福岡市の救急出場は10万件'], [4.4, 7.8, '1日274件、5分15秒に1回']],
    uses3D: () => true,
    setup(ctx) {},
    draw(ctx, lt, t) {
      reset3D();
      WD.forEach((w, i) => {
        const k = rankN[i];
        // 0.0〜2.5s: 輪郭が1区ずつ走る（中央区→博多区→中央区からの距離順）
        outlineU(i, E.outCubic(P(lt, 0.1 + k * 0.25, 0.8)), 0.9);
        // 2.5〜5.5s: 柱が立ち上がる（同じ順に 0.12s ずらし）
        const r = E.outCubic(P(lt, 2.5 + k * 0.12, 1.6));
        if (r > 0) setPillar(i, hOf(w.disp['2025']) * r, rampDisp(w.disp['2025']));
      });
      // カメラ: CAM0 からゆっくり回りながら、タイトルの出る 5.5s までに地図を右へ寄せる
      const s = { ...CAM0, theta: CAM0.theta + 0.015 * lt };
      setCam(shiftCam(s, 4 * eio(lt, 4.5, 1.5)));
      beginGL(); renderView(0, W);
      // タイトルの背後は「地図の方を薄く」する
      const thin = 0.5 * E.inOut(P(lt, 5.5, 1.0));
      if (thin > 0) { g.fillStyle = `rgba(244,246,249,${thin})`; g.fillRect(0, 0, W, H); }
      // 5.5〜8.0s: ロックアップ（小見出し・タイトル・罫線＋赤い正方形）
      if (lt >= 5.5) drawLockup(lt, M, 800, { sub: 6.2, dSub: 0.6, title: 5.5, dTitle: 1.0, rule: 6.2, dRule: 1.2 });
    },
  };
})();
