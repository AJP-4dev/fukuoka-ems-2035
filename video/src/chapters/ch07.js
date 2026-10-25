/* 第7章 妥当性 — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[7] = {
    title: '妥当性',
    q: 'この推計は、当たる？',
    concl: null,
    duration: 40,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第7章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, '妥当性', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 40), COL.navy, 2);
    },
  };
})();
