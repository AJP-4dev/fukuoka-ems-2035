/* 第2章 データの出どころ — 契約は ../../CONTRACT.md。IIFE で包み、トップレベルに名前を出さない。
 * 見せる動き: 7枚の資料カードが順に着地する（地はワイプ、罫線が一周して閉じる。0.9秒おき、lt≈7.9で全部そろう）。
 * 残りは左カラムの入れ替えと、カードから線が走って1点に集まる（計算へ）だけ。 */
(() => {
  // [資料名, 発行元と年, 何に使うか, 意味色, 市=0/国=1]
  const SRC = [
    ['福岡市の将来人口推計（令和6年4月）', '福岡市　2024年', '区ごと、年齢ごとの将来の人口', COL.navy, 0],
    ['福岡市消防年報（令和3〜6年版）', '福岡市消防局', '出場件数、年齢別の搬送人員、救急隊の数', COL.red, 0],
    ['福岡市 登録人口', '福岡市　2024年12月末ほか', 'いまの区×年齢の人口（計算の出発点）', COL.navy, 0],
    ['国勢調査（昼間人口、メッシュ）', '総務省統計局　2020年', '通勤や通学で入ってくる人、署所の受け持ち（1km四方）', COL.orange, 1],
    ['救急・救助の現況（令和7年版）', '総務省消防庁　2025年', '65歳以上の3つの年齢帯の運ばれ方の形', COL.red, 1],
    ['地域別将来推計人口（令和5年推計）', '社人研　2023年', '2035年以降の、区ごとの年齢の配分', COL.navy, 1],
    ['面積調、区界の地図データ', '国土地理院、国土数値情報', '区の面積と地図の形', COL.navy, 1],
  ];
  const T_IN = SRC.map((s, k) => 1.6 + k * 0.9);           // 着地の時刻（1.6 … 7.0）
  const CX = 800, CW = 790, CH = 88, CY = (k) => 168 + k * 104;   // 最下段の下端 = 168+6*104+88 = 880
  // 強調（他のグループを薄くする）: 市の資料を説明する間は国を、国の資料を説明する間は市を薄く
  const DIM = [[17.8, 21.6], [10.0, 17.4]];                // grp0(市) を薄くする区間, grp1(国) を薄くする区間
  const alphaOf = (grp, lt) => 1 - 0.55 * win(lt, DIM[grp][0], DIM[grp][1], 0.4);
  const boxRun = (u, x, y, w, h, c, lw) => polyline([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], u, c, lw);
  const NODE = [1690, CY(3) + CH / 2];

  window.CHAPTERS[2] = {
    title: 'データの出どころ', q: '何を材料にした？', concl: null, duration: 26,
    subs: [[1.6, 9.4, '全部、公開されている資料'], [9.8, 17.4, '人口は市の推計、救急は消防年報'], [17.8, 25.6, '出典はサイトの方法タブに']],
    uses3D: () => false,
    setup(ctx) {},
    draw(ctx, lt, t) {
      /* ── 左カラム ── */
      wtext(lt, 1.4, null, '7つの公開資料', LX, 320, { size: 48 });
      rule(lt, 1.6, LX, 352, 420, COL.navy, 1);
      const L = [0, 370, 790, 520];
      phase(lt, 1.6, 9.6, () => {
        wtext(lt, 2.0, null, '人口の資料が4つ、', LX, 440, { size: 28 });
        wtext(lt, 3.4, null, '救急の資料が2つ、', LX, 488, { size: 28 });
        wtext(lt, 4.8, null, '地図の資料が1つ', LX, 536, { size: 28 });
        wtext(lt, 6.6, null, 'どれも、誰でも手に入る', LX, 640, { size: 20, c: COL.sub });
      }, L);
      phase(lt, 10.0, 17.2, () => {
        wtext(lt, 10.0, null, '福岡市の資料', LX, 430, { size: 20, c: COL.sub });
        wtext(lt, 10.2, null, '将来の人口は、\n市の推計をそのまま使う', LX, 482, { size: 28, lead: 44 });
        wtext(lt, 12.6, null, '救急の実績は、\n消防年報の4年分', LX, 600, { size: 28, lead: 44 });
        rule(lt, 13.0, LX, 666, tw('消防年報の4年分', 28), COL.red, 2);
        wtext(lt, 15.0, null, '2021〜2024年の実績と、2013年からの推移', LX, 730, { size: 20, c: COL.sub });
      }, L);
      phase(lt, 18.0, 26, () => {
        wtext(lt, 18.0, null, '国の資料', LX, 430, { size: 20, c: COL.sub });
        wtext(lt, 18.2, null, '昼の人口は国勢調査、', LX, 482, { size: 28 });
        wtext(lt, 19.4, null, '高齢者の運ばれ方は消防庁、', LX, 530, { size: 28 });
        wtext(lt, 20.6, null, '面積と地図は国土地理院', LX, 578, { size: 28 });
        wtext(lt, 22.4, null, '出典の詳細は\nサイトの「方法」タブに', LX, 680, { size: 28, lead: 44, c: COL.sub });
      }, L);

      /* ── 右: 資料カード ── */
      SRC.forEach(([t1, t2, t3, c, grp], k) => {
        const t0 = T_IN[k], y = CY(k);
        if (lt < t0) return;
        withAlpha(alphaOf(grp, lt), () => {
          const fu = E.outCubic(P(lt, t0, 0.6));
          wipe(fu, CX, y, CW, CH, () => { g.fillStyle = COL.paper; g.fillRect(CX, y, CW, CH); });
          boxRun(E.outCubic(P(lt, t0, 0.8)), CX, y, CW, CH, COL.navy, 1);
          const bu = E.outCubic(P(lt, t0 + 0.15, 0.4));
          if (bu > 0) { g.fillStyle = c; g.fillRect(CX, y + CH * (1 - bu), 4, CH * bu); }
          wtext(lt, t0 + 0.2, null, String(k + 1).padStart(2, '0'), CX + 24, y + 40, { size: 20, tab: true, c: COL.sub });
          wtext(lt, t0 + 0.25, null, t1, CX + 72, y + 40, { size: 28, w: 800 });
          wtext(lt, t0 + 0.35, null, t2, CX + CW - 20, y + 38, { size: 20, c: COL.sub, align: 'right' });
          wtext(lt, t0 + 0.5, null, '使い道：' + t3, CX + 72, y + 74, { size: 20 });
        });
      });

      /* ── 20.8〜: 7本の線がカードの右端から走り、1点に集まる（計算の材料になる。縦の線は使わない） ── */
      SRC.forEach((s, k) => {
        const y = CY(k) + CH / 2, u = E.outCubic(P(lt, 20.8 + k * 0.1, 0.7));
        if (u <= 0) return;
        withAlpha(1, () => line(CX + CW, y, lerp(CX + CW, NODE[0], u), lerp(y, NODE[1], u), COL.navy, 1.5));
      });
      if (lt >= 21.9) dot(NODE[0], NODE[1], 7 * E.outCubic(P(lt, 21.9, 0.3)), COL.navy);
      wtext(lt, 22.5, null, '区ごとの\n計算へ', NODE[0] + 18, NODE[1] - 4, { size: 20, lead: 30 });
      // 保持中の小さな動き: 集まった点から細い輪がゆっくり広がる
      if (lt >= 22.8) {
        const v = ((lt - 22.8) % 2.0) / 2.0;
        withAlpha(0.45 * (1 - v), () => { g.strokeStyle = COL.navy; g.lineWidth = 1.5; g.beginPath(); g.arc(NODE[0], NODE[1], 9 + 16 * v, 0, Math.PI * 2); g.stroke(); });
      }
    },
  };
})();
