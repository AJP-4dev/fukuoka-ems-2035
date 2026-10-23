#!/usr/bin/env bash
# 一括ビルド: (--full: 生データ抽出) -> trend -> model -> html -> pytest
# 既定は src/raw/ が無くても動く（抽出済み JSON はコミット済み）。
# --full は src/raw/ の生データ（PDF・IPSS xlsx・Excel/CSV・e-Stat メッシュ）が必要。無ければ各スクリプトがエラーで止まる。
set -euo pipefail
cd "$(dirname "$0")/.."
PY=".venv/bin/python -I"

if [ "${1:-}" = "--full" ]; then
  echo "== --full: 生データ抽出（src/raw/ が必要）"
  $PY src/extract_projection.py src/raw/shouraijinkousuikei.pdf src/raw/ipss/suikei_kekka.xlsx
  $PY src/make_base_inputs.py
  $PY src/make_nenpo_inputs.py
  $PY src/build_small_areas.py
elif [ $# -gt 0 ]; then
  echo "usage: scripts/build.sh [--full]" >&2; exit 2
fi

$PY src/build_trend.py
$PY src/build_model.py
$PY src/build_html.py
.venv/bin/pytest -q
