from conftest import ROOT, load, WARDS


def test_base_inputs_2025():
    B = load('base_inputs.json')
    assert set(B['wards']) == set(WARDS)
    tot = sum(sum(B['wards'][w]['pop2025'].values()) for w in WARDS)
    # 登録人口(住基)は推計人口(約166万)より約5万人少なく約160.8万人。計画書の164〜168万は推計人口の値で登録人口には当たらないため下限を調整
    assert 1_580_000 <= tot <= 1_680_000
    assert tot == 1_608_140   # 2024-12-31 登録人口 全市総数と一致
    for w in WARDS:
        assert len(B['wards'][w]['pop2025']) == 19 and B['wards'][w]['area'] > 0
        assert B['wards'][w]['day20'] > 0 and B['wards'][w]['night20'] > 0
    assert B['wards']['博多']['day20'] / B['wards']['博多']['night20'] > 1.4   # 都心


def test_city_age_series():
    B = load('base_inputs.json')
    assert set(B['cityAgeByYear']) == {str(y) for y in range(2013, 2025)}
    for y, d in B['cityAgeByYear'].items():
        assert len(d) == 19 and 1_450_000 <= sum(d.values()) <= 1_680_000, y


def test_codes_and_commute_identity():
    B = load('base_inputs.json')
    assert {w: B['wards'][w]['code'] for w in WARDS} == {
        '東': '40131', '博多': '40132', '中央': '40133', '南': '40134',
        '西': '40135', '城南': '40136', '早良': '40137'}
    assert B['wards']['西']['area'] == 84.16 and B['wards']['早良']['area'] == 95.87
    for w in WARDS:
        d = B['wards'][w]
        assert d['day20'] == d['night20'] - d['out'] + d['in'], w
        assert d['dn'] == round(d['day20'] / d['night20'], 3)
    assert list(B['wards']['東']['pop2025']) == [f'{a}～{a + 4}歳' for a in range(0, 90, 5)] + ['90歳以上']
