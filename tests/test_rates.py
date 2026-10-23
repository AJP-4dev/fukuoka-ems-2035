import sys
from conftest import ROOT, load, WARDS
sys.path.insert(0, str(ROOT / 'src'))
from rates import GROUPS, BAND_WEIGHTS, to_groups, fukuoka_rates


def test_groups_sum_preserved():
    pop19 = load('projection.json')['wards']['東']['2025']
    assert abs(sum(to_groups(pop19).values()) - sum(pop19.values())) < 1e-6


def test_elder_level_is_fukuoka_and_shape_is_national():
    B, N = load('base_inputs.json'), load('nenpo_inputs.json')
    pop19 = {b: sum(B['wards'][w]['pop2025'][b] for w in WARDS) for b in B['wards']['東']['pop2025']}
    r = fukuoka_rates(N['years']['2024']['transportAge'], pop19, N['national2024'])
    g = to_groups(pop19)
    assert abs(sum(r[e]*g[e] for e in ('e1','e2','e3')) - 48773) < 1
    nat = {e: N['national2024']['transport'][e]/N['national2024']['pop'][e] for e in ('e1','e2','e3')}
    assert abs(r['e2']/r['e1'] - nat['e2']/nat['e1']) < 1e-6 and abs(r['e3']/r['e1'] - nat['e3']/nat['e1']) < 1e-6
    assert 0.120 <= sum(r[e]*g[e] for e in ('e1','e2','e3'))/sum(g[e] for e in ('e1','e2','e3')) <= 0.140
