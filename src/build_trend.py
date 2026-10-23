"""年齢調整利用率のトレンド（設計 §5.3）とバックテスト（§5.4）。python -I src/build_trend.py で trend.json を書く。

adjRate[y] = 出場件数[y] / Σ_g pop(y,g) × rate2024[g]。
rate2024 は搬送ベース（Task 8 と同じ fukuoka_rates）、分子は出場件数なので 2024 年でも 1.0 にならず
出場/搬送比（約 1.148）になる。使うのは傾きだけなので水準のずれは問題ない。
"""
import json
import math
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
from rates import GROUPS, to_groups, fukuoka_rates  # noqa: E402

CAP_YEAR = 2040
YEARS = list(range(2013, 2025))


def annual_mult(scn, year, trend):
    if scn == 'L':
        return 1.0
    if scn == 'M':
        return (1 + trend['slopePre']) ** (min(year, trend.get('capYear', CAP_YEAR)) - 2024)
    if scn == 'H':
        return (1 + trend['slopeAll']) ** (year - 2024)
    raise ValueError(scn)


def ols(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
    return b, my - b * mx


def build():
    B = json.load(open(ROOT / 'src/base_inputs.json', encoding='utf-8'))
    N = json.load(open(ROOT / 'src/nenpo_inputs.json', encoding='utf-8'))
    bands = B['wards'][next(iter(B['wards']))]['pop2025'].keys()
    pop25 = {b: sum(w['pop2025'][b] for w in B['wards'].values()) for b in bands}
    rate = fukuoka_rates(N['years']['2024']['transportAge'], pop25, N['national2024'])
    expected = {y: sum(to_groups(B['cityAgeByYear'][str(y)])[g] * rate[g] for g in GROUPS) for y in YEARS}
    disp = {y: N['series']['dispatch'][str(y)] for y in YEARS}
    adj = {y: disp[y] / expected[y] for y in YEARS}

    def fit(ys):
        return ols(ys, [math.log(adj[y]) for y in ys])
    pre = list(range(2013, 2020))
    b_pre, a_pre = fit(pre)
    b_all, _ = fit([y for y in YEARS if y not in (2020, 2021)])
    pred, actual, err = {}, {}, {}
    for y in (2022, 2023, 2024):
        pred[str(y)] = math.exp(a_pre + b_pre * y) * expected[y]
        actual[str(y)] = disp[y]
        err[str(y)] = (pred[str(y)] - disp[y]) / disp[y] * 100
    share = {}
    for y in range(2021, 2025):
        t = N['years'][str(y)]['transportAge']
        s = sum(t.values())
        share[str(y)] = {k: v / s for k, v in t.items()}
    return {
        'years': YEARS, 'adjRate': {str(y): adj[y] for y in YEARS},
        'slopePre': math.exp(b_pre) - 1, 'slopeAll': math.exp(b_all) - 1, 'capYear': CAP_YEAR,
        'backtest': {'fitYears': [2013, 2019], 'pred': pred, 'actual': actual, 'errPct': err},
        'ageShare': share,
    }


if __name__ == '__main__':
    out = build()
    json.dump(out, open(ROOT / 'src/trend.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(out['slopePre'], out['slopeAll'], out['backtest']['errPct'])
