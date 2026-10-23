from conftest import ROOT, load, WARDS


def test_nenpo_totals():
    N = load('nenpo_inputs.json')
    for y, d in N['years'].items():
        assert sum(d['dispatchWard'].values()) + d['outside'] == d['dispatchTotal'], y
        assert sum(d['typeDispatch'].values()) == d['dispatchTotal'], y
        assert sum(d['transportAge'].values()) == d['transportTotal'], y
    assert N['years']['2024']['dispatchTotal'] == 100181 and N['years']['2024']['transportTotal'] == 87291
    assert N['series']['dispatch']['2013'] == 68299 and N['series']['dispatch']['2024'] == 100181
    assert set(N['series']['dispatch']) == {str(y) for y in range(2013, 2025)}


def test_station_units():
    N = load('nenpo_inputs.json')
    assert sum(N['stationsUnits'].values()) == 34


def test_national_shape():
    N = load('nenpo_inputs.json')['national2024']
    r = {g: N['transport'][g] / N['pop'][g] * 1000 for g in ('e1', 'e2', 'e3')}
    assert 55 <= r['e1'] <= 62 and 118 <= r['e2'] <= 130 and 240 <= r['e3'] <= 258
