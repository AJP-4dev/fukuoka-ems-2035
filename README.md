# 福岡市 救急需要の未来地図 2025→2050

消防職員向けに、福岡市7区の救急出場件数と必要な救急隊数を 2025〜2050 年まで推計し、単一 HTML（`index.html`）で可視化するプロジェクトです。人口変化のみ（L）・コロナ前トレンド継続（M）・上振れ（H）の3シナリオを並べ、10年先（2035年）を主役に、2050年まで切り替えて見られます。数値は公表資料から再計算した**推定値**で、公式見解・公式予測ではありません（借用・推定の内容は末尾参照）。

公開: https://ajp-4dev.github.io/fukuoka-ems-2035/ （GitHub Pages・公開リポ AJP-4dev/fukuoka-ems-2035）

## 主な結果（2026-10-23 時点）

| 項目 | 2025 | 2035 | 2050 |
|---|---|---|---|
| 年間出場件数 L（人口変化のみ） | 100,139 | 112,124（+12.0%） | 121,804 |
| 年間出場件数 M（トレンド継続） | 100,139 | 125,165（+25.0%） | 142,944 |
| 年間出場件数 H（上振れ） | 100,139 | 138,192（+38.0%） | 199,637 |
| 基準救急隊数（整備指針の算式） | 35 | 39 | 42 |

現行は 34 隊（令和7年3月31日時点）。出所は `src/model.json` / `data.js`。

## 構成

| パス | 内容 |
|---|---|
| `template.html` | 画面のテンプレート（5タブ＋区別＋署所）。`/*__DATA__*/` にデータを注入 |
| `data.js` | モデル出力をまとめた `const DATA=...`（生成物・コミット済み） |
| `index.html` | 公開する単一 HTML（`template.html` + `data.js` から生成・コミット済み） |
| `src/extract_projection.py` | 将来人口推計 PDF / 社人研 xlsx → `projection.json` |
| `src/make_base_inputs.py` / `make_nenpo_inputs.py` | 登録人口等 → `base_inputs.json`、消防年報の転記 → `nenpo_inputs.json` |
| `src/build_small_areas.py` | e-Stat 1km メッシュ → `small_areas.json`（署所按分用） |
| `src/fetch_geo.py` / `geocode_stations.py` | 区界ポリゴン `wards_geo.json`、署所の緯度経度 `stations.json`（ネットワーク。出力はコミット済み） |
| `src/rates.py` | 年齢6帯・搬送率の作り方 |
| `src/build_trend.py` | 年齢調整利用率のトレンドとバックテスト → `trend.json` |
| `src/build_stations.py` | 署所別の負担推計（`build_model.py` から呼ばれる） → `stations_load.json` |
| `src/build_model.py` | 6帯×7区×2025–2050 のモデル → `model.json`, `data.js` |
| `src/build_html.py` | `index.html` を生成 |
| `src/*.json` | 上記の中間・最終データ（コミット済み。`src/raw/` の生データだけ git 管理外） |
| `tests/` | pytest（46件）。入力・モデル・署所・HTML を検査 |
| `docs/superpowers/` | 設計書（specs/）と実装計画（plans/） |
| `scripts/build.sh` | 一括ビルド |

## 再生成

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # 初回のみ
scripts/build.sh           # trend → model → html → pytest（src/raw/ 不要）
scripts/build.sh --full    # 先に生データから再抽出（src/raw/ が必要）
```

`--full` は `src/raw/shouraijinkousuikei.pdf`、`src/raw/ipss/suikei_kekka.xlsx`、登録人口等の Excel/CSV を使います（無いファイルがあるとスクリプトがそのファイル名を示して止まります）。e-Stat の 1km メッシュは `build_small_areas.py` が自動でダウンロードします。`index.html` は生成物ですが、GitHub Pages 用にコミットします。

## スライド

- Web 版: https://ajp-4dev.github.io/fukuoka-ems-2035/slides.html
- PPTX: `slides/fukuoka-ems-2035-slides.pptx`
- 再生成: `node slides/build_pptx.mjs`

## 動画

レポートの「動画」タブで、約6分40秒・無音・字幕つきの解説動画（`media/fukuoka-ems-2035.mp4`）を再生できます。章リストをクリックするとその位置へ移動します。`data.js` から決定論的にレンダしています（Playwright＋ffmpeg）。

- 再レンダ: `cd video && node scripts/render.mjs`
- 仕様: `video/SPEC.md`／契約: `video/CONTRACT.md`

## 出典

| 資料（年） | URL | 用途 |
|---|---|---|
| 福岡市の将来人口推計（令和6年4月） | https://www.city.fukuoka.lg.jp/soki/kikaku/shisei/fukuokashikihonkosokihonkeikaku/jinkousuikeiH23/documents/shouraijinkousuikei.pdf | 全市の将来人口、区別 2034 年まで |
| 社人研 日本の地域別将来推計人口（令和5年推計） | https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp | 2035年以降の区別×年齢の構成比 |
| 福岡市 登録人口（区別・年齢別、2025） | https://www.city.fukuoka.lg.jp/soki/tokeichosa/shisei/toukei/jinkou/tourokujinkou/TourokuJinko_kubetsu.html | 基準人口 |
| 福岡市消防年報 令和6年版 救急統計 | https://www.city.fukuoka.lg.jp/syobo/somu/about/documents/r6.kyuukyuutoukei.pdf | 出場・搬送・年齢別・所要時間（R3〜R6 版を使用） |
| 福岡市消防年報 令和6年版 救急自動車等の配置 | https://www.city.fukuoka.lg.jp/syobo/somu/about/documents/r6.4_kyuukyuu.pdf | 署所ごとの隊数（34隊） |
| 消防年報 一覧（R3〜R6） | https://www.city.fukuoka.lg.jp/syobo/somu/about/syoubounenpou-kakobun.html | 年報の所在 |
| 福岡市統計書 第18章 第5表 | https://www.city.fukuoka.lg.jp/soki/tokeichosa/shisei/toukei/toukeisyo/2024/documents/1805.xls | 事故種別の推移 |
| 福岡市消防局 署所の所在地 | https://www.city.fukuoka.lg.jp/syobo/somu/about/syozaiti.html | 署所の住所（緯度経度は国土地理院ジオコーダ等） |
| niiyz/JapanCityGeoJson（40131〜40137） | https://github.com/niiyz/JapanCityGeoJson | 区界ポリゴン |
| 国土地理院 面積調 | https://www.gsi.go.jp/KOKUJYOHO/MENCHO-title.htm | 区面積 |
| e-Stat 国勢調査2020・経済センサス2021 地域メッシュ統計 | https://www.e-stat.go.jp/ | 昼夜間人口・署所按分 |
| 消防庁 令和7年版 救急・救助の現況 | https://www.fdma.go.jp/pressrelease/houdou/items/kyuuki_20260116.pdf | 全国の年齢区分別搬送人員（65–74/75–84/85+ の形状） |
| 総務省 人口推計 2024 | https://www.stat.go.jp/data/jinsui/2024np/pdf/2024np.pdf | 上記の年齢区分別人口 |
| 東京消防庁 令和5年 救急活動の現況 図表2-5 | https://www.tfd.metro.tokyo.lg.jp/content/000071238.xlsx | 18–64歳を分けない根拠 |
| 消防力の整備指針（消防庁告示）第13条 | https://www.fdma.go.jp/ | 基準隊数の算式 |

詳細は設計書 `docs/superpowers/specs/2026-10-23-fukuoka-ems-design.md` の §4・§13。

## 推定値・借用の注意

- 年齢6帯（0–6／7–17／18–64／65–74／75–84／85+）のうち、65歳以上の内訳は**全国の形状**を借用（水準は福岡の実績に合わせて補正）。
- 昼間補正は係数 0.35 の仮定値（通勤・通学者が区内にいる時間、約8.5時間÷24時間から置いた）。
- 署所別の負担は、1kmメッシュの最寄り署所への按分による推定（年報に署所別実績は無い）。
- 区別の年齢構成：2020–2034年は市推計PDFの区別表を帯ごとに全市表へ比例配分して整合（区別表は全市表と帯別で最大約8,000人食い違うため）。2035年以降は社人研推計の構成比で市推計を配分した推定（整合後の2034年とは線形に接続）。
- 基準人口は住民基本台帳ベースの登録人口。基準隊数の算式は消防力の整備指針 第13条による試算で、福岡市独自の基準ではない。

## ライセンス・免責

公表資料を再計算した個人制作物で、福岡市・福岡市消防局の公式見解ではありません。
