import sys

from conftest import ROOT, load, WARDS

sys.path.insert(0, str(ROOT / 'src'))


def test_station_loads_sum_to_ward():
    M, S = load('model.json'), load('stations_load.json')
    for w in M['wards']:
        for y in w['disp']:
            assert abs(sum(s['load'][y] for s in S if s['ward'] == w['name']) - w['disp'][y]) <= 2, (w['name'], y)


def test_station_loads_sum_exact_all_years():
    M, S = load('model.json'), load('stations_load.json')
    for w in M['wards']:
        for y in w['disp']:
            assert sum(s['load'][y] for s in S if s['ward'] == w['name']) == w['disp'][y], (w['name'], y)


def test_zero_unit_stations():
    S = load('stations_load.json')
    zero = [s for s in S if s['units'] == 0]
    assert {s['id'] for s in zero} == {'reisen', 'sasaoka', 'hanahata', 'muromi'}
    for s in zero:
        assert s['load']['2025'] == 0 and s['perUnit']['2025'] is None and s['note'] == '救急隊なし'
        assert s['popKey'] == 0 and s['arriveEst'] is None


def test_per_unit_plausible_range():
    # 外れ値: 西戸崎 389(小さな半島の受け持ち) / 堅粕 6,469(博多駅東側のオフィス街が隊1の署所に載る最寄り按分の癖。
    # 実際は最寄りの空き隊が署所をまたいで対応するので上限寄りの推定)
    # 機動救急(kido)は移動待機の隊で按分対象外（perUnit=null）なので除く
    for s in load('stations_load.json'):
        if s['units'] > 0 and s['id'] != 'kido':
            assert 300 <= s['perUnit']['2025'] <= 7000, (s['name'], s['perUnit']['2025'])


def test_kido_is_roaming():
    k = next(s for s in load('stations_load.json') if s['id'] == 'kido')
    assert k['popKey'] == 0 and k['load']['2025'] == 0 and k['perUnit']['2025'] is None
    assert k['arriveEst'] is None and k['note'] == '機動救急（移動待機）'


def test_arrive_est_reasonable():
    for s in load('stations_load.json'):
        if s['units'] > 0 and s['id'] != 'kido':
            assert isinstance(s['arriveEst'], int) and 240 <= s['arriveEst'] <= 720, (s['name'], s['arriveEst'])


def test_downtown_not_undercounted():
    S = load('stations_load.json'); M = load('model.json')
    hakata = sum(s['popKey'] for s in S if s['ward'] == '博多')
    night = next(w for w in M['wards'] if w['name'] == '博多')['night20']
    assert hakata > night * 1.1      # 従業地人口を混ぜた効果


def test_small_areas_shape_and_wards():
    D = load('small_areas.json')
    assert '_source' in D and '_method' in D
    A = D['areas']
    assert A and {a['ward'] for a in A} == set(WARDS)
    assert all({'key', 'ward', 'lon', 'lat', 'night', 'work'} <= set(a) for a in A)
    assert all(129.9 < a['lon'] < 130.6 and 33.4 < a['lat'] < 33.95 for a in A)


def test_small_areas_match_census_night():
    A, M = load('small_areas.json')['areas'], load('model.json')
    for w in M['wards']:
        n = sum(a['night'] for a in A if a['ward'] == w['name'])
        assert abs(n / w['night20'] - 1) < 0.03, (w['name'], n, w['night20'])


def test_main_pipeline_embeds_stations():
    import re, json
    txt = (ROOT / 'data.js').read_text(encoding='utf-8')
    D = json.loads(re.match(r'const DATA=(.*);\s*$', txt, re.S).group(1))
    assert D['stations'] == load('stations_load.json')


def test_arrive_est_weighted_mean_matches_city():
    # 出場件数で加重した署所平均 = 福岡 2024 年 通報→現着の実測（492 秒）
    S, N = load('stations_load.json'), load('nenpo_inputs.json')
    act = [s for s in S if s['units'] > 0 and s['id'] != 'kido']
    wm = sum(s['load']['2025'] * s['arriveEst'] for s in act) / sum(s['load']['2025'] for s in act)
    assert abs(wm - N['years']['2024']['timeSec']['arrive']) <= 1, wm
