/* 第6章 結果③ どこで — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[6] = {
    title: '結果③ どこで',
    q: '増えるのは、どこ？',
    concl: null,
    duration: 55,
    subs: [],
    uses3D: () => true,   // スタブ: 3D の煙テスト（全区の柱を 2035 年の増減色で）
    draw(ctx, lt, t) {
      // スタブ: 3D 煙テスト（2025→2035 の柱が伸び、色は増減率）＋章番号
      reset3D(); beginGL();
      const u = E.inOut(P(lt, 1.2, 3));
      WD.forEach((w, i) => setPillar(i, hOf(lerp(w.disp['2025'], w.disp['2035'], u)), divCol(wDiff35(w) * u)));
      setCam({ ...CAM0, theta: CAM0.theta + 0.01 * lt });
      renderView(0, W);
      WD.forEach((w, i) => wardLabel3D(i, hOf(w.disp['2035']), w.name, sgn(wDiff35(w)) + '%', COL.red, ein(lt, 4.5)));
      wtext(lt, 1.4, null, '第6章', LX, 220, { size: 48 });
    },
  };
})();
