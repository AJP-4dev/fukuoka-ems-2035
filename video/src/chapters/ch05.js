/* 第5章 結果② 誰が — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[5] = {
    title: '結果② 誰が',
    q: '増えるのは、誰？',
    concl: null,
    duration: 40,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第5章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, '結果② 誰が', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 40), COL.navy, 2);
    },
  };
})();
