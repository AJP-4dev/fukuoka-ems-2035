# CONTRACT.md — 章ファイルの契約（並列実装用）— 福岡版

動画: 1920×1080 / 30fps / **DURATION = 400秒（12,000フレーム）**＝BASE 392秒＋第1〜10章の一拍 QPAD 0.8秒×10。無音。
福岡版の仕様は `SPEC.md`（確定数値・章ビート・依頼主の嗜好）。本書は横浜版の契約を継承し、福岡のデータに合わせて直したもの。
構成: `src/scene.html`（骨格・触らない） + `src/lib.js`（共通基盤） + `src/chapters/ch00.js … ch10.js`（章ごと）。

```
src/scene.html      THREE を window.THREE に載せ → data.js → lib.js → ch00..ch10 を順に読み込む
                    タイムライン（確定表）・seek(t)・章レール・章見出し・問いカード・結論カード・字幕帯
src/lib.js          色/定数/イージング/文字/チップ/線・棒/2D地図/3D地図/ロゴ など（グローバル関数）
src/chapters/chNN.js window.CHAPTERS[NN] = {...} を登録するだけ
```

## 1. 確定タイムライン（scene.html の `BASE` が正。章側で変えない）

`BASE = [8, 18, 26, 60, 40, 40, 55, 40, 40, 35, 30]`、`QPAD = 0.8`（第1章以降は問いカードの一拍ぶん実長が +0.8s）、`CPAD = 0`（結論カード無し）。
章ファイルの `duration` は BASE の値。章に渡る `lt` は一拍を差し引いた時刻（0 … duration）。

| 章 | ファイル | title | 開始(s) | 実長(s) | duration(BASE) | 開始フレーム | 3D |
|---|---|---|---:|---:|---:|---:|---|
| 0 | ch00.js | 冒頭 | 0 | 8 | 8 | 0 | ○ 全編 |
| 1 | ch01.js | 問い | 8 | 18.8 | 18 | 240 | |
| 2 | ch02.js | データの出どころ | 26.8 | 26.8 | 26 | 804 | |
| 3 | ch03.js | どう計算したか | 53.6 | 60.8 | 60 | 1608 | |
| 4 | ch04.js | 結果① 市全体 | 114.4 | 40.8 | 40 | 3432 | |
| 5 | ch05.js | 結果② 誰が | 155.2 | 40.8 | 40 | 4656 | |
| 6 | ch06.js | 結果③ どこで | 196 | 55.8 | 55 | 5880 | ○（見せ場） |
| 7 | ch07.js | 妥当性 | 251.8 | 40.8 | 40 | 7554 | |
| 8 | ch08.js | 隊の負担 | 292.6 | 40.8 | 40 | 8778 | |
| 9 | ch09.js | 署所（推定） | 333.4 | 35.8 | 35 | 10002 | （2D地図） |
| 10 | ch10.js | 長期と示唆 | 369.2 | 30.8 | 30 | 11076 | |
| — | | 終了 | 400 | | | 12000 | |

章ローカル時刻 `lt`（0 … duration）の共通構造（scene.html が自動で描く）:
- 問いカード（白板が左→右にワイプで入り、「？」と `q` が走って現れ、抜ける）は章の実時刻 0〜2.0s（一拍込み）。第0章は無し。章に渡る `lt` では 0〜1.2 が問いカードの下になるので、本編は `lt = 1.2` から。
- `1.0s〜` 左上に章見出し（`NN  title`、20px）。上端に章レール（1本の罫線＋章境界の目盛）。
- 結論カードは**福岡版では出さない**（`CPAD=0`・`drawConcl` は無効）。`concl` は常に `null`。
- `subs` の字幕を画面下に表示（y=944、高さ56、左揃え、左端に赤い4px縦線、切替はクロスフェード0.25s）。

## 2. 章ファイルの雛形

```js
/* 第N章 */
(() => {                                   // ← 必ず IIFE。トップレベルに const/function を出さない（他章と衝突して全体が止まる）
  // 章専用の定数・計算はここ（DATA から計算する。SPEC の確定数値以外の数字を作らない）
  const ROWS = WD.map((w) => w.name);
  window.CHAPTERS[N] = {
    title: '章名',                          // 章見出し・問いカードに出る
    q: '問い（問いカード）？',               // 第0章のみ null
    concl: null,                            // 福岡版は結論カード無し（常に null）
    duration: 40,                           // 確定表の duration(BASE) の値（変えない）
    subs: [[1.6, 7.6, '字幕1行22文字以内'], [8.0, 14.0, '…']],  // 章ローカル秒・重ねない・間は0.4s以上
    uses3D: (lt) => lt >= 16 && lt < 33.6,   // 3Dを表示する区間だけ true（省略=2Dのみ）
    setup(ctx) {},                          // 読み込み直後に1回（重い前計算はここか IIFE 内で）
    draw(ctx, lt, t) {                      // 毎フレーム。lt と t だけから全状態を決める（純関数）
      wtext(lt, 1.4, null, '見出し', LX, 240, { size: 48 });
      wtext(lt, 1.8, null, '本文1行目\n本文2行目', LX, 330, { size: 28, lead: 44 });
      chip(lt, 6.0, 15.0, '注釈は短く', LX, 520, { c: COL.red });
    },
  };
})();
```

- `ctx = { g, W, H, M, LX, LW, RX0, RX1, TL, START, DURATION }`（`g` は 1920×1080 の Canvas2D）。
- `uses3D(lt)` が true のフレームは 2D キャンバスが透明で始まり、3D キャンバスが下に見える。**3D の描画は draw の中で自分で行う**（§5）。false のフレームは背景 `#f4f6f9` で塗られた状態で draw が呼ばれる。
- draw の中で `g.save()/restore()` の対応を崩さないこと（scene.html 側でも save/restore で囲んでいる）。
- 禁止: `Date.now()`, `performance.now()` を絵に使う, `requestAnimationFrame`, `setTimeout`, CSS transition, `Math.random()`（乱数が要るなら t から作る）, ネットワーク, 外部画像・フォント。

## 3. デザイン規約（統括の方針。SPEC より優先）

- **レイアウト**: 文字は左カラム（`LX=80`〜`LX+LW=760`）、グラフは右（`RX0=800`〜`RX1=1840`）。安全マージン80px（`M`）。字幕帯（y=944〜1000）とかぶる位置（y>900）に本文を置かない。
- **文字サイズは 120 / 48 / 28 / 20 の4段だけ**。日本語は Hiragino Sans（本文 600、見出し 800）、数字は Avenir Next Demi Bold（600）で桁揃え（`numText` / `wtext(..., {tab:true})`）。数字は単位つきで同じ行に（例「25.7人」）。
- **入場の動きは3種だけ**: マスクワイプ（`wtext`, `wipe`）／線が走る（`rule`, `polyline`, `line`）／伸びる（棒の長さ・柱の高さ）。フェード入場は禁止（字幕の切替だけ例外）。退場はワイプアウト（`phase` の終わり、`wtext` の tOut）。
- **1章に「見せる動き」は1つ**。残りは静かに。ただし3秒以上の完全静止は作らない（字幕の進行線・章レールは常に動いている。それ以外にも小さな動きを）。
- **色**: 紺と白が主体。赤 `COL.red` は「出場件数」と「強調」だけ。水色・淡青・青・橙・赤・紫は年齢6帯と増減の意味色だけ（`AGEC`）。章ごとに新色を増やさない。
- **禁止**: 大きな数字＋小ラベルの中央寄せカードの多用／グラデーション背景・グロー・パーティクル／全要素の「フェード＋下からスライド」／英字の全大文字ラベル／「A · B · C」の中黒区切り（列挙は「、」）／末尾の「→」装飾／角丸カードの敷き詰め（角丸は注釈チップの6pxだけ）。
- **注釈チップは同時に最大3つ**。字幕は1行22文字以内・同時に1行。文体は体言止め・短文、専門語には言い換え（搬送率＝1年に救急車で運ばれる人の割合 など）。
- **数字**: SPEC の「画面に出す確定数値」以外を作らない。DATA から計算できるものは計算して表示（`SC.L(2035)` 等）。

## 4. lib.js の関数一覧（すべてグローバル）

### 定数・色
| 名前 | 内容 |
|---|---|
| `W, H, M` | 1920, 1080, 80（安全マージン） |
| `LX, LW, RX0, RX1` | 左カラム x=80・幅680／右エリア 800〜1840 |
| `COL` | `bg #f4f6f9, paper, ink/navy #14213d, sub #5b6b82, faint, red #e63946, purple, orange, green, blue, sky, line, grid, grey` |
| `AGE, AGEC, AGEL` | `['k','j','w','e1','e2','e3']`（= `DATA.groups`）／年齢6帯の色（k #9ad0f5, j #bfd7f2, w #3a7bd5, e1 #f4a259, e2 #e63946, e3 #8e3b8f）／ラベル（0–6歳／7–17歳／18–64歳／65–74歳／75–84歳／85歳以上） |
| `RAMPS, ramp(stops,t), mix(a,b,u)` | 色ランプ（サイトと同じ `RAMPS.disp`, `RAMPS.diff`）／2色の補間 |
| `rampDisp(v)` | 出場件数（7,000〜23,000）→ 紺系の色（福岡7区は 7,275〜22,046 で収まる） |
| `rampDiv(v, hi=15, lo=-12)` | 増減率% → 0%≈白、＋は橙→赤、−は緑 |
| `divCol(v)` | `rampDiv(v, 15, -5)`（3D地図の増減率の色。凡例は −5%〜+15%。福岡は全区 +9.8〜+14.7% で橙〜赤、中央区が最も濃い） |

### イージング・時間
| 名前 | 内容 |
|---|---|
| `clamp(x,a=0,b=1)`, `lerp(a,b,u)` | |
| `E.outCubic / E.outExpo / E.inOut / E.outBack` | イージング関数（0..1） |
| `P(t, a, d)` | 区間 [a, a+d] の進捗 0..1 |
| `ein(t,a,d=0.8)` / `eio(t,a,d=1)` / `cnt(t,a,d=1.2)` | cubic-out／ease-in-out（カメラ）／ease-out-expo（カウンター） |
| `win(t,a,b,f=0.25)` | 区間 [a,b] の可視度（両端f秒で0→1→0。字幕用） |
| `counter(lt, t0, v, d=1.2)` | 0→v を ease-out-expo で数える文字列（桁区切りつき） |

### データ（DATA から）
年キーは**すべて文字列**（`w.pop['2025']`, `w.disp['2035']`, `DATA.series.dispatch['2024']`）。下の関数は年を数値でも文字列でも受け取る（内部で `yk(y)=String(y)`）。DATA を直接引くときは文字列キーで。
| 名前 | 内容 |
|---|---|
| `WD`, `WI`, `ward(name)` | 7区の配列（東・博多・中央・南・城南・早良・西の順）／名前→index（`WI['中央']`）／名前→区。`w.name` は「区」なし |
| `TR` | `DATA.trend` = `{slopePre, slopeAll, capYear:2040, adjRate, backtest{fitYears,pred,actual,errPct}, ageShare}` |
| `SER` | `DATA.series` = `{dispatch, transport, units}`（2013–2024、年キー文字列） |
| `STD` | `DATA.standard` = `{coef, demandPop{y}, units{y}（基準隊数 35→39→42）, current:34, crossYear}` |
| `ST` | `DATA.stations`（31署所: `{id,name,kind,ward,lon,lat,units,popKey,load{y},perUnit{y|null},arriveEst,note}`。隊なしは `perUnit` が null） |
| `yk(y)` | 年 → 文字列キー |
| `popT(w,y)`, `cityPop(y, age?)` | 区の総人口（6帯の和）／市の人口（`DATA.city[y].t`、年齢帯指定可） |
| `D24, PER_DAY, INTERVAL` | 100,181（`SER.dispatch['2024']`）／1日あたり 274（366日）／何秒に1回（315秒＝5分15秒） |
| `YEARS` | 2025…2050（数値） |
| `dispA(w,y)` | 区の出場（`w.disp[y]`＝下限シナリオ＝人口変化のみ。2025年も推計値。2024実績は `w.disp24`） |
| `SC.L/M/H(y)` | 市全体の出場：下限 `L=Σdisp[y]`（2035 112,124）／中間 `M=L×(1+slopePre)^(min(y,2040)−2024)`（125,165）／上限 `H=L×(1+slopeAll)^(y−2024)`（138,192） |
| `wDiff35(w)`, `wPopDiff35(w)` | 区の2035年 出場増減%（**2025年推計比**、`disp['2035']/disp['2025']−1`）／人口増減%（2025比） |
| `units(w)`, `overYear(w)` | 区の救急隊数（`w.unitsPerWard`）／1隊3,000件を超える最初の年（null=超えない。南区などは2025で既に超える） |
| `nonTrYear(y)` | 市の不搬送率（`1 − transport/dispatch`、2013–2024） |
| `fmt(n)`, `man(n,d=1)`, `sgn(v,d=1)`, `sgn2(v)` | 桁区切り／「160.8万」／「+12.0」「−2.3」／相関係数用「−0.01」 |
| `corr(xs,ys)`, `fit(xs,ys)` | 相関係数／回帰 [a,b]（y=a+bx） |
| `pctRange(arr)` | 絶対値の [min,max] |

その他 DATA（lib に関数なし、直接引く）: `DATA.nenpo2024={typeDispatch,transportAge,timeSec,nonTrRate}`、`DATA.rates{k..e3}`（搬送率、人口1人あたり/年）、`DATA.city[y]{k..e3,t}`、`w.byAge[y]{k..e3}`（区の年齢別出場）、`w.fac`（校正係数）、`w.dayExtra`（昼間補正）、`w.dn`（昼夜間人口比）、`w.loadPerUnit24`（1隊あたり2024実績）、`DATA.scn{L,M,H}.name`。
横浜専用の `hourly`, `nonTr`, `arrive`, `types`, `growthGroup`, `w.unitsDay`, `TR.dispatch`, `SC.A/B/T` は**無い**（使うと止まる）。

### 文字・図形（Canvas2D、`g` に描く）
| 名前 | 内容 |
|---|---|
| `text(s,x,y,{size,w,c,align,base,num,halo,ls,a})` | 1行を描いて幅を返す（はみ出し検査に記録される） |
| `numText(s,x,y,{size,c,align})` | 桁揃えの数字（Avenir Next 600）。単位の日本語も混ぜてよい |
| `tw(s,size,w=600,num=false)` | 文字幅 |
| **`wtext(lt, tIn, tOut, s, x, y, o)`** | **基本の文字**。tIn からマスクワイプで現れ、tOut（null=出たまま）でワイプアウト。`\n` で複数行、`o.lead` 行間、`o.tab:true` で数字桁揃え、`align:'right'/'center'` |
| `rule(lt, tIn, x, y, w, c=navy, lw=1, d=0.6)` | 左から伸びる罫線 |
| `phase(lt, a, b, fn, box=[x,y,w,h])` | 区間 [a,b] だけ fn を描き、b から box を左→右にワイプアウト（画面の入れ替え） |
| `wipe(u, x,y,w,h, fn, v=0)` / `clipRect(x,y,w,h,fn)` | 矩形マスク（u=現れ具合、v=消え具合） |
| `bgWipe(lt, t0, d=0.8)` | 背景色が左→右に画面を覆う（3D→2Dの切替など） |
| `line(x1,y1,x2,y2,c,lw,dash)`, `dot(x,y,r,c)`, `arrow(...)`, `rrect(...)` | 基本図形（rrect はチップ以外で角丸を使わない） |
| `polyline(pts, u, c, lw=3, dash)` | 折れ線を u(0..1) まで左から描く。先端座標を返す |
| `axes(lt, t0, C, xt, yt)` | 軸と補助線。`C={x0,x1,y0,y1,X(v),Y(v)}`, `xt/yt=[[値,'ラベル'],…]` |
| **`chip(lt, t0, t1, s, x, y, {c, align})`** | **注釈チップ**（20px W6・白地・1px紺罫・角丸6px・意味色の点）。[t0,t1] で表示、左→右ワイプで出入り。高さ40。縦に並べるなら y を52ずつ。**同時3つまで** |
| `withAlpha(a, fn)` | 透明度（強調で他を薄くするとき。入場には使わない） |
| `drawConclAt(l, s)` | 結論カードを任意の時刻に描く（通常は `concl` で自動。第10章のように途中に置くときだけ） |

### 2D 地図
| 名前 | 内容 |
|---|---|
| `drawMap(box, fillFn(w,i), {stroke, lw, alphaFn})` | 7区のポリゴン（島を含む全 rings）を box `{x,y,w,h}` に収めて塗る。返り値 `xf` |
| `mapXf(box)`, `wardC(xf, w)` | 座標変換／区の重心の画面座標。署所の点は `xf.f(st.lon, st.lat)` |
| `px(lon,lat)` | 経緯度 → ワールド [x,z]（`K=100, LON0=130.400, LAT0=33.590, CL=cos(33.59°)`） |

### ロゴ
| 名前 | 内容 |
|---|---|
| `drawLockup(u, x, y, o?)` | タイトルのロックアップ（小見出し「福岡市 2025 → 2035」（`LOGO_CITY`）、120px W8「救急需要の未来地図」（`LOGO`）を左→右ワイプ、紺のルールが伸び先端の赤い正方形が止まる）。u=秒、(x,y)=タイトルのベースライン左端。**`o` で時刻割りを指定可**（`{sub,dSub,title,dTitle,rule,dRule}`、既定 `{0,0.6,0.2,1.0,1.1,1.2}`）。第0章は `drawLockup(lt, M, 800, {sub:6.2,title:5.5,rule:6.2})`。第0章と第10章末尾で同じ形 |
| `ORDER_N, rankN[i], DIST_N, DMAX` | 中央区→博多区→中央区からの距離順（同心円）の並び |
| `ORDER_X, rankX[i]` | 西→東の並び |

## 5. 3D 地図ユーティリティ（three.js、平行投影、影・エッジつき）

シーンは lib.js で1回だけ作られている（7区の押し出し柱 `meshes[i]`、2段目用 `lows[i]`、輪郭線 `outlines[i]`、床・影・グリッド・ライト）。東区（志賀島・海の中道）と西区（能古島）は島を含む複数シェイプで押し出してある。座標はサイトと同じ `px(lon,lat)`、`C3[i]` が区の重心 [x,z]。

毎フレームの手順（`uses3D(lt)` が true のときの draw の中）:
```js
reset3D();                    // 全部を非表示・既定値に戻す（前フレームの状態を持ち越さない）
beginGL();                    // GL キャンバスを全面クリア
WD.forEach((w, i) => setPillar(i, hOf(w.disp['2025']), rampDisp(w.disp['2025'])));   // 高さと色
setCam({ ...CAM0, theta: CAM0.theta + 0.01 * lt });                      // カメラ（t の関数にする）
renderView(0, W);             // 描画
wardLabel3D(WI['中央'], hOf(ward('中央').disp['2035']), '中央', '+14.7%', COL.red);  // ラベルは2Dで重ねる（setCam の後）。「区」は自動で付く
```
| 名前 | 内容 |
|---|---|
| `reset3D()` / `beginGL()` | 状態リセット／全面クリア（毎フレーム必須） |
| `setPillar(i, h, color, op=1)` | 柱 i を高さ h・色で表示（`scale.y=h`） |
| `hOf(v)` | 出場件数 → 柱の高さ（`0.4 + v/23000*7`。最大 博多 22,046 で約7.1） |
| `setColorHSL(mat, a, b, u)` | 色を HSL 補間（`meshes[i].material` に。色の切替は必ずこれで） |
| `meshes[i].userData.line.material.opacity` | エッジ線（紺）の濃さ。既定0.3。強調時に上げる |
| `lows[i]` | 2段に割る用のもう1本（`visible`, `scale.y`, `material.color` を直接設定。上段は `meshes[i].position.y` を持ち上げる） |
| `outlines[i]` | 輪郭線（主な外周の Line。島の外周は子 `userData.extra[]`）。**走らせるのは `outlineU(i, u, op=0.9)`**（島も同じ割合で走る）。直接 `setDrawRange` すると島が描かれない |
| `outlineU(i, u, op)` | 【福岡版で追加】区 i の輪郭線を u(0..1) まで走らせる |
| `setCam(s, vx=0, vw=W)` | カメラ `{theta, phi, dist, tx, tz}`（theta=方位、phi=天頂からの角、dist=縦に写る幅）。vx,vw はビューポート |
| `lerpCam(a, b, u)` | カメラ補間（u は `eio(...)` で ease-in-out） |
| `shiftCam(s, dx)` | 地図を画面上で右へ dx（ワールド単位）ずらす。左カラムに文字を置くときは +4〜+8 |
| `meanC(['博多','中央'])` | 区群の重心 [x,z]（カメラを寄せる先。都心寄せ） |
| `renderView(vx, vw, sx=vx, sw=vw)` | ビューポート [vx, vx+vw] に描く。sx,sw はシザー（ワイプで一部だけ見せる） |
| `proj(x,y,z)` | ワールド → 画面座標（直前の setCam のビューポート基準） |
| `wardLabel3D(i, h, l1, l2, c2, a=1, left=false)` | 柱の上に「名前 ＋ 数字」ラベル（白縁つき）。区名なら自動で「区」が付く。left=true で左側に出す |
| `wn(w or name)` | 区名を常に「◯◯区」に（2D の文字はこれを通す） |
| `CAM0` | 福岡7区が全画面に余白つきで収まる既定の角度 `{theta:-0.35, phi:0.95, dist:29, tx:-2.8, tz:-2.7}`（柱が 2035 年の高さでも上下に約120px 以上の余白） |

**左右分割（同じ角度で 2025｜2035）**:
```js
reset3D(); beginGL();
WD.forEach((w, i) => setPillar(i, hOf(w.disp['2025']), rampDisp(w.disp['2025'])));
setCam(CS, 0, W / 2); renderView(0, W / 2);                     // 左半分
WD.forEach((w, i) => setPillar(i, hOf(w.disp['2035']), divCol(wDiff35(w))));
setCam(CS, W / 2, W / 2); renderView(W / 2, W / 2);             // 右半分（同じ CS）
line(W / 2, 0, W / 2, H, COL.navy, 1.5);                         // 中央の分割線（2D）
```
中央からの縦ワイプは `renderView(W/2, W/2, W/2, (W/2)*u)`（シザー幅を 0→W/2）。分割時は `dist` を 40 前後に（半幅でも市全体が入る。要 `--frames` 確認）。

## 6. 確認コマンド（`video/` で実行）

```bash
node scripts/render.mjs --frames 6000,6300,6600          # 静止画 → out/frames/f-XXXX.png（フレーム = 秒×30）
node scripts/render.mjs --scale 0.5 --start 5880 --end 7554 --out ch06.mp4   # 章の下書き動画（out/ch06-video-only.mp4）
node scripts/_probe.mjs 0.5     # 全編QA: 字幕22字超・チップ>3・安全マージン外の文字（OOB）・コンソールエラー
node scripts/_still.mjs         # 3秒以上ほぼ変化しない区間（章レール除く）を列挙
```
- 章の代表フレーム番号 = (開始秒 + 0.8 + lt) × 30（第1章以降。一拍 QPAD を足す）。例: 第6章 lt=12.5 → (196+0.8+12.5)×30 = 6279。第0章は lt×30。
- 静止画は必ず Read で目視し、文字のはみ出し・重なり・意図と違う動きを直す。`[pageerror]` / `[console]` エラーは0に（`GL Driver Message … GPU stall due to ReadPixels` は Chromium のスクリーンショット時の性能警告で、無視してよい）。
- 本番レンダ（`node scripts/render.mjs` → `out/fukuoka-ems-2035.mp4`、12,000フレーム）は統括が実行する。
- 描画時間の目安（福岡版スタブで実測、1920×1080 PNG 込み）: 2D 章 約90ms/フレーム、3D 章 約270ms/フレーム。

## 7. 複数の章を並列で作るときの注意
- 触ってよいのは自分の `src/chapters/chNN.js` だけ。lib.js に足したい関数は章ファイル内に閉じて書き、共通化は統括に提案する。
- 3D シーン（`meshes` など）は全章で共有。必ず毎フレーム `reset3D()` から始め、マテリアルの色・不透明度・`position.y` を自分で設定する（前の章の状態に頼らない）。
- 横浜版の完成章は `~/Dev/yokohama-ems-2035/video/src/chapters/` にある（参考。データ参照は福岡の文字列年キー・6帯・SC.L/M/H に直すこと）。

## 8. 福岡版での注意（依頼主の確定嗜好・横浜版 v2 から継承）
- **結論カード無し**（`concl: null`、`CPAD=0`）。章の切替は問いカードの一拍（`QPAD=0.8`）だけ。
- **区名は常に「◯◯区」**。2D の文字は `wn(w)`、3D ラベルは `wardLabel3D`（自動で「区」）。「中央」「博多」単独で出さない。
- **点やチップの出現は1秒以内**（署所31点も1秒以内に全部出す）。順次に1個ずつ長く出す演出はしない。
- **縦線や順次の枠囲いの演出はしない**（目安線の縦線も使わない。横棒の色で示す）。
- **URL は出さない**（`URL_TXT` は廃止。サイトUIの模型も出さない）。
- 冒頭（第0章 8秒）は輪郭→柱→タイトルのみ。カウンターは出さず、数字は字幕で。
- 区の並び順や「中心」は中央区（`ORDER_N`）。西区は福岡にもあるので、名前で並べるときは「中央」「博多」を明示する。
- 年キーは文字列。`w.disp[2035]` は JS では `w.disp['2035']` と同じに動くが、`w.disp[y + 1]` のような計算値も含め、迷ったら `yk(y)` を使う。
