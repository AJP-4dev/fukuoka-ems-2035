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


def test_pop_tab_present():
    t = _t()
    assert 'id="tab-pop"' in t
    assert 'id="tab-st"' in t
    assert t.count('class="src"') >= 3
    order = [t.index("['%s'," % k) for k in ('map', 'pop', 'city', 'wards', 'st', 'insight', 'method')]
    assert order == sorted(order)


def test_stations_tab_and_layer():
    t = _t()
    assert 'id="tab-st"' in t and 'DATA.stations' in t and '推定' in t
    assert '署所を表示' in t and '公式の統計ではありません' in t
    assert 'ST_RANGE=7000' in t and 'class="src"' in t


def test_ward_cards_three_types():
    t = _t()
    assert 'function wardText' in t and 'TYPE_RULE' in t
    body = t[t.index('function wardText'):t.index('function buildWards')]
    for k in ('都心・来街型', '伸びる住宅地型', '成熟型'):
        assert k in body, k
        assert k in t


def test_method_page_and_sources():
    t = _t()
    for k in ('救急・救助の現況', '0.35', '答え合わせ', '推定', '借りた値', '実例'):
        assert k in t, k
    # 出典行は静的HTML(class="src")と srcLine() の呼び出しで描画される。実DOM側の数は目視監査で確認
    assert t.count('class="src"') + t.count('srcLine(') >= 20
    assert 'safe(' not in t and 'legacy-guard' not in t
    for dead in ('A40', 'T24', 'annualT', 'data-time', '#page-slides', 'm=arrive', 'm=density'):
        assert dead not in t, dead
    for k in ('式を文章で', '図解', '実例の手計算', '使ったデータ一覧', '留意点'):
        assert k in t, k


def test_final_review_wording():
    t = (ROOT / 'template.html').read_text(encoding='utf-8')
    assert 'id="chTime"' in t                      # 市全体の所要時間図
    assert 'TYPE_RULE にまとめ' not in t and 'small_areas.json の注記' not in t   # 開発者向け文言なし
    assert '2025年（人口変化のみ）比' in t
    assert '到着の目安' not in t and 'arriveEst' not in t
    for f in ('template.html', 'slides_template.html', 'README.md'):
        assert '\u6a2a\u6d5c' not in (ROOT / f).read_text(encoding='utf-8'), f


def test_slides_page():
    import subprocess, sys
    t = (ROOT / 'slides_template.html').read_text(encoding='utf-8')
    assert t.count('/*__DATA__*/') == 1
    subprocess.run([sys.executable, '-I', str(ROOT / 'src' / 'build_html.py')], check=True)
    s = (ROOT / 'slides.html').read_text(encoding='utf-8')
    assert 'const DATA=' in s and '/*__DATA__*/' not in s
    assert '推定' in s
    # スライドは SL.push 21 回で生成される（section class="slide" はテンプレートで1回描画）
    assert s.count('SL.push(') == 21
    assert 'class="slide' in s
    assert 'href="slides.html"' in (ROOT / 'template.html').read_text(encoding='utf-8')


def test_video_tab_present():
    t = _t()
    assert 'id="tab-video"' in t
    assert 'https://ajp-4dev.github.io/fukuoka-ems-2035/media/fukuoka-ems-2035.mp4' in t
