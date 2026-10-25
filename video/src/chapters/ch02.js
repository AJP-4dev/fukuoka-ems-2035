/* 第2章 データの出どころ — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[2] = {
    title: 'データの出どころ',
    q: '何を材料にした？',
    concl: null,
    duration: 26,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第2章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, 'データの出どころ', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 26), COL.navy, 2);
    },
  };
})();
