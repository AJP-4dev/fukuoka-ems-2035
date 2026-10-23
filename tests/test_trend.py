import sys
from conftest import ROOT, load
sys.path.insert(0, str(ROOT / 'src'))
from build_trend import annual_mult


def test_trend_slopes():
    T = load('trend.json')
    assert T['years'] == list(range(2013, 2025))
    assert 0.0 < T['slopePre'] < 0.05 and T['slopePre'] < T['slopeAll'] < 0.08
    assert T['adjRate']['2020'] < T['adjRate']['2019']
    assert T['capYear'] == 2040


def test_backtest_reported():
    T = load('trend.json')['backtest']
    assert set(T['errPct']) == {'2022', '2023', '2024'} and all(abs(v) < 40 for v in T['errPct'].values())


def test_age_share():
    S = load('trend.json')['ageShare']
    assert set(S) == {'2021', '2022', '2023', '2024'}
    assert all(abs(sum(v.values()) - 1) < 1e-9 and len(v) == 5 for v in S.values())


def test_annual_mult():
    T = load('trend.json')
    assert annual_mult('L', 2035, T) == 1.0
    assert annual_mult('M', 2045, T) == annual_mult('M', 2040, T)
    assert annual_mult('H', 2035, T) > annual_mult('M', 2035, T) > 1.0
