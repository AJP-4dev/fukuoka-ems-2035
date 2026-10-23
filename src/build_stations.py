"""署所別の推定負担 → src/stations_load.json

各小地域(1kmメッシュ×区の断片)を、同じ区の「隊あり」署所の最寄り（直線）に付け、キー = 夜間×0.65 + 従業者×0.35 を署所ごとに合計。
区の出場 disp[year]（シナリオL）を区内署所のキー比で按分する（端数は最大の署所に寄せ、署所合計=区の出場を厳守）。
機動救急(kido)は移動待機の隊なので按分に入れない。隊なし署所(units=0)は負担0・note「救急隊なし」。
"""
import json
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
NIGHT_W, WORK_W = 0.65, 0.35

# 到着時間の目安: 横浜市 令和6年 87隊（増強隊18を除く, yokohama-ems-2035/src/build_model.py UNIT_ROWS）の
# (平均距離 km -> 現場到着 分) の最小二乗直線  分 = ARRIVE_SLOPE * 距離km + ARRIVE_ICPT  (r=0.80)
# 福岡は等価半径 r=sqrt(受け持ち面積/π) の 0.6 倍を平均走行距離の代理（円内の点の平均距離は 2r/3 だが道路迂回を見込み 0.6 とした仮定）。
ARRIVE_SLOPE, ARRIVE_ICPT = 1.7529, 3.9488
DIST_FACTOR = 0.6
# 切片の校正: 横浜の回帰の傾き（距離による相対差）だけを借り、切片は平行移動して
# 「2024年出場件数で加重した署所平均 = 福岡の2024年 通報→現着の実測（nenpo_inputs years.2024.timeSec.arrive = 492秒）」に合わせる。
# 横浜の回帰そのままだと平均約6:10で、福岡の実測8:12より系統的に短かった。よって署所の値は絶対値でなく「市平均に合わせた相対値」。
_N24 = json.load(open(HERE / 'nenpo_inputs.json', encoding='utf-8'))['years']['2024']
ARRIVE_CITY_SEC = _N24['timeSec']['arrive']


def _dist2(lon1, lat1, lon2, lat2):
    k = math.cos(math.radians((lat1 + lat2) / 2))
    return ((lon1 - lon2) * k) ** 2 + (lat1 - lat2) ** 2


def build_station_loads(model_wards, stations, small_areas):
    out, years, raw_sec = [], list(model_wards[0]['disp']), {}
    for w in model_wards:
        ws = [s for s in stations if s['ward'] == w['name']]
        active = [s for s in ws if s['units'] > 0 and s['id'] != 'kido']
        key = {s['id']: 0.0 for s in ws}
        for a in small_areas:
            if a['ward'] != w['name']:
                continue
            best = min(active, key=lambda s: _dist2(a['lon'], a['lat'], s['lon'], s['lat']))
            key[best['id']] += a['night'] * NIGHT_W + a['work'] * WORK_W
        tot = sum(key.values())
        big = max(active, key=lambda s: key[s['id']])
        load = {s['id']: {} for s in ws}
        for y in years:
            d = w['disp'][y]
            for s in active:
                load[s['id']][y] = int(round(d * key[s['id']] / tot))
            load[big['id']][y] += d - sum(load[s['id']][y] for s in active)
            for s in ws:
                if s not in active:
                    load[s['id']][y] = 0
        for s in ws:
            act = s in active
            sec = None
            if act:
                r = math.sqrt(w['area'] * key[s['id']] / tot / math.pi)
                raw_sec[s['id']] = (ARRIVE_SLOPE * DIST_FACTOR * r + ARRIVE_ICPT) * 60
            out.append({
                'id': s['id'], 'name': s['name'], 'kind': s['kind'], 'ward': s['ward'], 'lon': s['lon'], 'lat': s['lat'],
                'units': s['units'], 'popKey': round(key[s['id']], 1) if act else 0, 'load': load[s['id']],
                'perUnit': {y: (round(v / s['units']) if act else None) for y, v in load[s['id']].items()},
                'arriveEst': sec,
                'note': '機動救急（移動待機）' if s['id'] == 'kido' else ('' if act else '救急隊なし'),
            })
    # 出場件数（2024年実績ベースの2025年値）で加重した署所平均が ARRIVE_CITY_SEC になるよう切片を平行移動
    wt = {r['id']: r['load']['2025'] for r in out if r['id'] in raw_sec}
    shift = ARRIVE_CITY_SEC - sum(wt[i] * raw_sec[i] for i in wt) / sum(wt.values())
    for r in out:
        if r['id'] in raw_sec:
            r['arriveEst'] = int(round(raw_sec[r['id']] + shift))
    order = {s['id']: i for i, s in enumerate(stations)}
    return sorted(out, key=lambda r: order[r['id']])


def build():
    M = json.load(open(HERE / 'model.json', encoding='utf-8'))
    S = json.load(open(HERE / 'stations.json', encoding='utf-8'))
    A = json.load(open(HERE / 'small_areas.json', encoding='utf-8'))['areas']
    return build_station_loads(M['wards'], S, A)


if __name__ == '__main__':
    res = build()
    (HERE / 'stations_load.json').write_text(json.dumps(res, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    for y in ('2025', '2035', '2050'):
        top = max((s for s in res if s['perUnit'][y]), key=lambda s: s['perUnit'][y])
        print(y, top['name'], top['perUnit'][y])
