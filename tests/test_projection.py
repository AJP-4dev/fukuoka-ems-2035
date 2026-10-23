from conftest import ROOT, load, WARDS


def test_projection_shape():
    P = load('projection.json')
    assert P['years'] == list(range(2020, 2051)) and len(P['bands']) == 19
    for w in WARDS:
        for y in P['years']:
            assert len(P['wards'][w][str(y)]) == 19, (w, y)


def test_ward_sum_matches_city():
    # 総数は千人丸め×7区＋全市丸めの範囲で一致。帯別はPDF自体が区別推計と全市推計で
    # 最大約8,100人ずれる（20代の移動仮定）ため、帯別は 9,000 人以内で確認する。
    P = load('projection.json')
    for y in (2020, 2025, 2035, 2050):
        diffs = []
        for b in P['bands']:
            ws = sum(P['wards'][w][str(y)][b] for w in WARDS)
            d = ws - P['city'][str(y)][b]
            assert abs(d) <= 9000, (y, b)
            diffs.append(d)
        assert abs(sum(diffs)) <= 7 * 100 + 100 + 100, y


def test_city_total_2040_peak():
    P = load('projection.json')
    tot = {y: sum(P['city'][str(y)].values()) for y in P['years']}
    assert abs(tot[2020] - 1_612_400) <= 1500 and max(tot, key=tot.get) in range(2038, 2043)


def test_city_has_reference_years():
    P = load('projection.json')
    assert sorted(map(int, P['city'])) == list(range(2020, 2066))
