import json, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parents[1] / 'src'))
from conftest import ROOT, load, WARDS


def test_model_calibration_and_fit():
    M = load('model.json')
    assert sum(w['disp']['2025'] for w in M['wards']) == 100181 - M['outside']
    assert 0.85 <= M['preCalibRatio'] <= 1.15
    assert all(0.75 <= w['fac'] <= 1.30 for w in M['wards'])


def test_pop_base_and_growth():
    M, B, P = load('model.json'), load('base_inputs.json'), load('projection.json')
    for w in M['wards']:
        assert abs(sum(w['pop']['2025'].values()) - sum(B['wards'][w['name']]['pop2025'].values())) <= 1
        g = sum(w['pop']['2026'].values()) / sum(w['pop']['2025'].values())
        p = sum(P['wards'][w['name']]['2026'].values()) / sum(P['wards'][w['name']]['2025'].values())
        assert abs(g - p) < 0.002


def test_standard_units():
    S = load('model.json')['standard']
    assert 30 <= S['units']['2025'] <= 45 and S['units']['2035'] > S['units']['2025']
    assert S['crossYear']['L'] is None or 2025 <= S['crossYear']['L'] <= 2050


def test_data_js_roundtrip():
    txt = (ROOT / 'data.js').read_text(encoding='utf-8')
    D = json.loads(txt[len('const DATA='):].rstrip(';\n'))
    assert D['groups'] == ['k', 'j', 'w', 'e1', 'e2', 'e3'] and len(D['wards']) == 7
    assert D['years'][0] == 2025 and D['years'][-1] == 2050
    assert len(D['stations']) == 31 and D['standard']['current'] == 34
    assert [w['name'] for w in D['wards']] == WARDS
    assert sum(w['unitsPerWard'] for w in D['wards']) == 34
