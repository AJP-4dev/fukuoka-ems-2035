/* 第4章 結果① 市全体 — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[4] = {
    title: '結果① 市全体',
    q: '2035年、市全体で何件？',
    concl: null,
    duration: 40,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第4章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, '結果① 市全体', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 40), COL.navy, 2);
    },
  };
})();
