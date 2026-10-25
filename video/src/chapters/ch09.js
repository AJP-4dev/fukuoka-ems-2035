/* 第9章 署所（推定） — スタブ（福岡版の基盤用）。章担当がこのファイルを丸ごと書き換える。契約は ../../CONTRACT.md */
(() => {
  window.CHAPTERS[9] = {
    title: '署所（推定）',
    q: '先に詰まるのは、どの署所？',
    concl: null,
    duration: 35,
    subs: [],
    draw(ctx, lt, t) {
      // スタブ: 章番号と章名だけ（本実装で置き換える）
      wtext(lt, 1.4, null, '第9章', LX, 300, { size: 48 });
      wtext(lt, 1.8, null, '署所（推定）', LX, 380, { size: 28, c: COL.sub });
      rule(lt, 2.0, LX, 420, 680 * clamp(lt / 35), COL.navy, 2);
    },
  };
})();
