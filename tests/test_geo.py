import os
from conftest import ROOT, load, WARDS


def test_wards_geo():
    G = load('wards_geo.json')['wards']
    assert [g['name'] for g in G] == WARDS and all(len(g['rings'][0]) >= 20 for g in G)


def test_stations_inside_ward():
    from shapely.geometry import Point, Polygon
    G = {g['name']: Polygon(g['rings'][0]) for g in load('wards_geo.json')['wards']}
    S = load('stations.json')
    core = [s for s in S if s['kind'] in ('署', '出張所')]
    assert len(core) == 30 and sum(1 for s in S if s['kind'] == '署') == 7
    assert sum(s['units'] for s in S) == 34
    for s in S:
        assert G[s['ward']].buffer(0.01).contains(Point(s['lon'], s['lat'])), s['name']


def test_station_units_match_nenpo():
    p = ROOT / 'src' / 'nenpo_inputs.json'
    if not p.exists():
        import pytest
        pytest.skip('nenpo_inputs.json not yet present')
    su = load('nenpo_inputs.json')['stationsUnits']
    S = load('stations.json')
    assert sum(su.values()) == sum(s['units'] for s in S)
    for s in S:
        key = s['name'].replace('消防署', '本署').replace('出張所', '') if s['kind'] == '署' else s['name'].replace('出張所', '')
        if s['id'] == 'kido':
            key = '機動救急'
        assert su.get(key, 0) == s['units'], key
