from conftest import ROOT


def test_template_has_data_marker():
    t = (ROOT / 'template.html').read_text(encoding='utf-8')
    assert t.count('/*__DATA__*/') == 1
