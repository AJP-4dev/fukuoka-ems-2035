/* 第1章 問い — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[1] = {
    title: '問い',
    q: '人口が少し増えると、救急は？',
    concl: null,
    duration: 18,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第1章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, '問い', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 18), COL.navy, 2);
    },
  };
})();
