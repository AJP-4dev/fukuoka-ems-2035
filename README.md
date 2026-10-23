# 福岡市 救急需要の未来地図 2025→2035

福岡市の救急需要を2025年から2035年まで推計し、区ごとの変化を単一HTMLのレポートとして可視化するプロジェクトです。横浜市版（`~/Dev/yokohama-ems-2035`）の構成を引き継いでいます。

## ドキュメント

- 設計書: [docs/superpowers/specs/2026-10-23-fukuoka-ems-design.md](docs/superpowers/specs/2026-10-23-fukuoka-ems-design.md)
- 実装計画: [docs/superpowers/plans/2026-10-23-fukuoka-ems-2035.md](docs/superpowers/plans/2026-10-23-fukuoka-ems-2035.md)

## 再生成コマンド

```bash
.venv/bin/python -I src/build_model.py && .venv/bin/python -I src/build_html.py
```

## テスト

```bash
.venv/bin/pytest
```

## 公開状況

公開前（GitHub Pages 未設定）
