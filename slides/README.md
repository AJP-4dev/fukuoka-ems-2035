# 職員向けスライド（PPTX、21枚）

構成の正本: `docs/slides/outline-2026-10-26.md`。数値は `src/*.json` と `data.js` から読み込むため、モデル更新後に再生成すれば追随する。

## 再生成

```bash
cd slides
npm install        # 初回のみ（pptxgenjs）
node build_pptx.mjs   # -> fukuoka-ems-2035-slides.pptx
```

## 検査

```bash
.venv/bin/pip install "markitdown[pptx]" python-pptx
.venv/bin/python -m markitdown slides/fukuoka-ems-2035-slides.pptx   # 文字・順序の確認
.venv/bin/python slides/qa_structure.py slides/fukuoka-ems-2035-slides.pptx   # はみ出し・重なり・文字サイズ
```

## 注意（アウトラインとの差）
- スライド12: アウトラインの「人口1,000人あたり 5.9／12.0／24.9」は実際は人口100人あたり。100人あたりで表示し、65歳以上全体は 1,000人あたり値（135.8／118.2）も併記。
- スライド9: 東区の2035年の人口・搬送人員は JSON 準拠（85歳以上 19,021人→5,627人、合計 20,141人）。アウトライン記載の 18,918／20,187 とは異なる。出場件数 18,131→20,409 は一致。
- スライド17: 市平均 2,968 はアウトライン記載値（JSONからの単純計算は 2,947）。
- フォントは Hiragino Sans / Avenir Next（Mac）。Windows では代替フォントになる。
