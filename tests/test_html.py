from conftest import ROOT


def test_template_has_data_marker():
    t = (ROOT / 'template.html').read_text(encoding='utf-8')
    assert t.count('/*__DATA__*/') == 1


def _t():
    return (ROOT / 'template.html').read_text(encoding='utf-8')


def test_no_implicit_scale_switch():
    t = _t()
    assert 'RANGE_LATE' not in t and 'isLate(' not in t
    assert "mode==='long'" in t or 'MODE.long' in t


def test_scenario_and_groups_in_template():
    t = _t()
    for k in ("'L'", "'M'", "'H'", 'capYear', 'colorPct', 'PCT_RANGE=30'):
        assert k in t, k
