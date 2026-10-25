/* 第10章 長期と示唆 — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[10] = {
    title: '長期と示唆',
    q: '2050年まで見ると、どう備える？',
    concl: null,
    duration: 30,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第10章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, '長期と示唆', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 30), COL.navy, 2);
    },
  };
})();
