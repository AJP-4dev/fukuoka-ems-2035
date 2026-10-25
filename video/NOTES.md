# 実装メモ — 福岡版 動画の基盤（2026-10-26）

横浜版（~/Dev/yokohama-ems-2035/video）をコピーし、lib/scene/render/契約を福岡のデータに合わせた。章ファイルはスタブ（章担当が丸ごと書き換える）。

## 1. タイムライン
`BASE = [8, 18, 26, 60, 40, 40, 55, 40, 40, 35, 30]`、`QPAD=0.8`、`CPAD=0` → **DURATION = 400秒 / 12,000フレーム**。
開始フレーム: 0, 240, 804, 1608, 3432, 4656, 5880, 7554, 8778, 10002, 11076（終了 12000）。表は CONTRACT.md §1。

## 2. 変更点
- **lib.js**
  - 年齢6帯: `AGE=['k','j','w','e1','e2','e3']`、`AGEC`/`AGEL`（SPEC の色）。
  - データ: 年キーは文字列。`yk(y)` を追加し、`popT`/`cityPop`/`dispA`/`nonTrYear` は数値・文字列どちらでも受ける。
    `D24=SER.dispatch['2024']`（100,181）、`PER_DAY`=273.7、`INTERVAL`=315.7s、`YEARS`=2025..2050。
  - `SC = {L, M, H}`（L=Σdisp、M=L×(1+slopePre)^(min(y,2040)−2024)、H=L×(1+slopeAll)^(y−2024)）。検算: 2035 = 112,124 / 125,165 / 138,192、2050 L = 121,804（SPEC と一致）。
  - `wDiff35` は `disp['2035']/disp['2025']−1`、`units(w)=w.unitsPerWard`、`nonTrYear` は `DATA.series`。
  - 追加の別名: `SER`（series）、`STD`（standard）、`ST`（stations）、`LOGO_CITY='福岡市'`、`outlineU(i,u,op)`。
  - 削除: `SC.A/B/T`、`TR.dispatch/transport/growthGroup` 参照、`w.unitsDay`、`URL_TXT`。
  - 地図: `K=100, LON0=130.400, LAT0=33.590, CL=cos(33.59°)`。**島対応**: 東区（rings 3）・西区（rings 2）は全 rings を描く／押し出す（2D `drawMap`・`MAPB`・3D `ExtrudeGeometry(shapes)`）。
    輪郭線は `outlines[i]`（rings[0]）＋子 Line（`userData.extra`）。走らせるのは `outlineU`。
  - `ORDER_N`: 中央区 → 博多区 → 中央区からの距離順（`CHUO` 基準）。
  - `drawLockup(u,x,y,o)` に時刻割り `o` を追加（第0章と第10章で同じ関数を使える）。小見出しは「福岡市 2025 → 2035」。
- **scene.html**: BASE 置換、`<title>` を福岡に。QPAD/CPAD・レール・見出し・問いカード・字幕は不変。
- **render.mjs**: 既定 `--out fukuoka-ems-2035.mp4`（その時の video-only は `out/video-only.mp4`）。他は不変。
- **package.json**: name を `fukuoka-ems-2035-video` に。
- **章スタブ**: ch00 = SPEC の冒頭ビート（輪郭 0–2.4s → 柱 2.5–5.3s → ロックアップ 5.5–8s、字幕2本）で実装済みに近い。ch06 = 3D 煙テスト（柱が 2025→2035 に伸び増減色＋7区ラベル）。他は「第N章＋章名＋罫線」。q は全章に設定、concl は null。

## 3. CAM0
`CAM0 = { theta: -0.35, phi: 0.95, dist: 29, tx: -2.8, tz: -2.7 }`
- 2025 の柱で地図は画面 y≈160〜945、x≈430〜1380（f-0120）。2035 の柱（ch06 スタブ f-6600）でも上端 y≈140。
- dist 26・tx −4.5・tz 2.0 では東区の柱が上端で切れたため、ターゲットを北へ寄せて dist を広げた。
- 第0章は 4.5–6.0s に `shiftCam(+4)` で右へ寄せ、左下のロックアップと重なりを減らす（f-0239 で確認）。

## 4. 検証
- `--frames 0,30,60,120,200,239,300,1200,3000,6000,9000,11000`: コンソールエラー 0（`GPU stall due to ReadPixels` の性能警告のみ）。f-0030/0120/0239/1200/6600 を目視。
- `scripts/_probe.mjs 2`: 字幕超過・チップ超過・OOB・エラーなし。
- `--scale 0.5 --start 0 --end 240 --out smoke.mp4`: 960×540・240フレームの mp4 を出力（47秒）。確認後削除。
- 描画時間（1920×1080、PNG 込み、30フレーム平均・起動1.5s除く）: 2D スタブ 約90ms/フレーム、3D（ch06）約270ms/フレーム。

## 5. 未解決・注意
- 城南区は出場が少なく（7,275）柱が低いので、3D では周囲の柱に埋もれて淡い色の「穴」に見える。第6章でラベル・カメラの工夫が要る。
- 東区の「海の中道」片（rings[2]）は本体から離れた細い柱として見える（データどおり）。
- 区の重心 `w.c` は東区・西区で本土の重心に近い（島は含まない）想定。ラベル位置は章で要確認。
- 左右分割（§5）の dist は未調整（目安 40）。第6章の担当が `--frames` で決めること。
- `.gitignore` の `out/` はどの階層にも効くので video/out は除外済み。`video/node_modules` はシンボリックリンク。
