"""福岡市 救急需要推計モデル（6帯×7区×2025–2050）→ src/model.json, data.js

① 基準人口(2025)=登録人口(19帯) ② 将来人口=基準×社人研推計の帯別伸び
③ 搬送率(6帯)=fukuoka_rates ④ 昼間補正 ⑤ 期待出場=期待搬送×出場/搬送比 ⑥ 校正係数 fac=2024実績÷期待(2025)
シナリオ L のみ保持。M/H は front で annual_mult を乗算する。
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from rates import GROUPS, to_groups, fukuoka_rates  # noqa: E402
from build_trend import annual_mult  # noqa: E402

J = lambda n: json.load(open(HERE / n, encoding='utf-8'))
P, B, N, TREND = J('projection.json'), J('base_inputs.json'), J('nenpo_inputs.json'), J('trend.json')
GEO = {g['name']: g for g in J('wards_geo.json')['wards']}
N24 = N['years']['2024']
WARDS = list(N24['dispatchWard'])
YEARS = list(range(2025, 2051))
DAYF = 0.35
DR = N24['dispatchTotal'] / N24['transportTotal']
CURRENT_UNITS = N24['units']
WARD_OF_STATION = {}
for w, names in {'東': '東本署 西戸崎 和白 多々良 箱崎 水上', '博多': '博多本署 上牟田 板付 空港 那珂南 堅粕',
                 '中央': '中央本署 平尾 機動救急', '南': '南本署 曰佐 桧原', '城南': '城南本署 飯倉',
                 '早良': '早良本署 田隈 東入部', '西': '西本署 姪浜 壱岐 元岡'}.items():
    for s in names.split():
        WARD_OF_STATION[s] = w
assert set(WARD_OF_STATION) == set(N['stationsUnits'])
UPW = {w: sum(n for s, n in N['stationsUnits'].items() if WARD_OF_STATION[s] == w) for w in WARDS}
assert sum(UPW.values()) == CURRENT_UNITS, UPW

# ③ 搬送率（市全体 2025 登録人口）
bands = P['bands']
city19 = {b: sum(B['wards'][w]['pop2025'][b] for w in WARDS) for b in bands}
RATE = fukuoka_rates(N24['transportAge'], city19, N['national2024'])
cityPop25 = sum(city19.values())
RATE_ALL = N24['transportTotal'] / cityPop25


def pop19(w, y):
    """帯別伸び（推計値は百人丸めで帯別比がノイジー）を適用後、区総数の伸びを公式推計の総数の伸びに合わせて補正する。"""
    base, p0, py = B['wards'][w]['pop2025'], P['wards'][w]['2025'], P['wards'][w][str(y)]
    raw = {b: base[b] * py[b] / p0[b] for b in bands}
    s = (sum(py.values()) / sum(p0.values())) / (sum(raw.values()) / sum(base.values()))
    return {b: v * s for b, v in raw.items()}


def rnd(x):  # 四捨五入（half away from zero）
    return int(x + 0.5) if x >= 0 else -int(-x + 0.5)


def lrm(vals, total):
    """最大剰余法: 各値を整数化し、合計を total に一致させる"""
    fl = {k: int(v) for k, v in vals.items()}
    rest = total - sum(fl.values())
    for k in sorted(vals, key=lambda k: vals[k] - fl[k], reverse=True)[:rest]:
        fl[k] += 1
    return fl


wards, sum_exp25 = [], 0.0
for w in WARDS:
    bi = B['wards'][w]
    day_extra_tr = DAYF * (bi['in'] - bi['out']) * RATE['w']

    def expected(y):
        g = to_groups(pop19(w, y))
        e = {k: g[k] * RATE[k] for k in GROUPS}
        e['w'] += day_extra_tr
        return {k: v * DR for k, v in e.items()}

    d24 = N24['dispatchWard'][w]
    exp25 = sum(expected(2025).values())
    sum_exp25 += exp25
    fac = d24 / exp25
    pop, disp, by_age = {}, {}, {}
    for y in YEARS:
        e = expected(y)
        pop[str(y)] = {k: rnd(v) for k, v in to_groups(pop19(w, y)).items()}
        disp[str(y)] = rnd(sum(e.values()) * fac)
        by_age[str(y)] = lrm({k: v * fac for k, v in e.items()}, disp[str(y)])
    assert disp['2025'] == d24, (w, disp['2025'], d24)
    wards.append({'name': w, 'code': bi['code'], 'area': bi['area'], 'day20': bi['day20'], 'night20': bi['night20'],
                  'in': bi['in'], 'out': bi['out'], 'dn': bi['dn'],
                  'pop': pop, 'disp': disp, 'byAge': by_age, 'disp24': d24, 'fac': round(fac, 3),
                  'dayExtra': rnd(day_extra_tr * DR * fac), 'units': UPW[w], 'unitsPerWard': UPW[w],
                  'loadPerUnit24': rnd(d24 / UPW[w])})

pre_ratio = sum_exp25 / sum(N24['dispatchWard'].values())
city = {}
for y in YEARS:
    c = {k: sum(wd['pop'][str(y)][k] for wd in wards) for k in GROUPS}
    c['t'] = sum(c.values())
    city[str(y)] = c

# 整備指針（基準隊数）。利用率の伸びは需要を比例して増やすとみなし、シナリオ別基準 = units[y] × annual_mult
coef = {k: RATE[k] / RATE_ALL for k in GROUPS}
demand = {str(y): sum(wd['pop'][str(y)][k] * coef[k] for wd in wards for k in GROUPS) for y in YEARS}
units = {y: rnd((v - 100000) / 50000 + 5) for y, v in demand.items()}
cross = {}
for s in 'LMH':
    cross[s] = next((y for y in YEARS if units[str(y)] * annual_mult(s, y, TREND) > CURRENT_UNITS), None)
standard = {'coef': {k: round(v, 4) for k, v in coef.items()}, 'demandPop': {y: round(v) for y, v in demand.items()},
            'units': units, 'current': CURRENT_UNITS, 'crossYear': cross}

model = {'years': YEARS, 'groups': GROUPS, 'wards': wards, 'city': city, 'rates': {k: round(v, 5) for k, v in RATE.items()},
         'dispRatio': round(DR, 4), 'dayf': DAYF, 'outside': N24['outside'], 'preCalibRatio': round(pre_ratio, 4),
         'dispatchTotal': N24['dispatchTotal'], 'transportTotal': N24['transportTotal'], 'standard': standard}
json.dump(model, open(HERE / 'model.json', 'w', encoding='utf-8'), ensure_ascii=False)

# 署所別の推定負担（Task 9）。stations_load.json も同時に再生成する
from build_stations import build_station_loads  # noqa: E402
STATIONS = build_station_loads(wards, J('stations.json'), J('small_areas.json')['areas'])
(HERE / 'stations_load.json').write_text(json.dumps(STATIONS, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

DATA = {'years': YEARS, 'groups': GROUPS,
        'scn': {'L': {'name': '人口変化のみ'}, 'M': {'name': 'コロナ前のトレンドが続く'}, 'H': {'name': 'コロナ後の伸びも続く'}},
        'trend': {k: TREND[k] for k in ('slopePre', 'slopeAll', 'capYear', 'adjRate', 'backtest', 'ageShare')},
        'wards': [{**wd, 'c': GEO[wd['name']]['c'], 'rings': GEO[wd['name']]['rings']} for wd in wards],
        'city': city, 'series': N['series'],
        'nenpo2024': {'typeDispatch': N24['typeDispatch'], 'transportAge': N24['transportAge'], 'timeSec': N24['timeSec'],
                      'nonTrRate': round(1 - N24['transportTotal'] / N24['dispatchTotal'], 4)},
        'standard': standard, 'stations': STATIONS, 'rates': model['rates'], 'dispRatio': model['dispRatio'],
        'dayf': DAYF, 'outside': N24['outside']}
(HERE.parent / 'data.js').write_text('const DATA=' + json.dumps(DATA, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')

tot = lambda y: sum(wd['disp'][str(y)] for wd in wards)
facs = [wd['fac'] for wd in wards]
print(f"L 2025/2035/2050: {tot(2025):,}/{tot(2035):,}/{tot(2050):,}  preCalib {pre_ratio:.3f}  fac {min(facs)}–{max(facs)}  "
      f"standard units 2025/2035: {units['2025']}/{units['2035']}  cross {cross}")
if __name__ == '__main__':
    for s in 'MH':
        print(s, {y: round(tot(y) * annual_mult(s, y, TREND)) for y in (2035, 2050)})
    print({wd['name']: wd['fac'] for wd in wards}, {y: units[str(y)] for y in (2025, 2035, 2050)})
