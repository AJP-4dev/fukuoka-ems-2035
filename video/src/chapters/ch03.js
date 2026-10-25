/* 第3章 どう計算したか — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[3] = {
    title: 'どう計算したか',
    q: 'どうやって計算した？',
    concl: null,
    duration: 60,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第3章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, 'どう計算したか', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 60), COL.navy, 2);
    },
  };
})();
