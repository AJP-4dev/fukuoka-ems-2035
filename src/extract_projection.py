"""福岡市の将来人口推計PDF -> projection.json（pymupdfのテキスト層から抽出）"""
import json
import pathlib
import re
import sys

import pymupdf

BANDS = [f'{a}～{a + 4}歳' for a in range(0, 90, 5)] + ['90歳以上']
WARDS = ['東', '博多', '中央', '南', '城南', '早良', '西']
CITY_PAGES = [13, 14, 15, 16]
WARD_PAGES = list(range(19, 26))
SOURCE = ('福岡市の将来人口推計（令和6年4月）p10–22（全市は男女別・年齢階層別内訳、'
          '区別は同内訳）。2051–2065年は全市の参考値。')
# 区別ページの2035–2050は年齢階層別内訳が無く、棒グラフ画像に総人口（千人、5年刻み）のみ載る。
# PDFのp16–22（0始まり19–25）の画像を目視で書き起こした値。
WARD_TOTALS_K = {
    '東': {2035: 344, 2040: 345, 2045: 344, 2050: 342},
    '博多': {2035: 268, 2040: 269, 2045: 268, 2050: 266},
    '中央': {2035: 224, 2040: 225, 2045: 224, 2050: 223},
    '南': {2035: 275, 2040: 277, 2045: 276, 2050: 274},
    '城南': {2035: 137, 2040: 138, 2045: 137, 2050: 137},
    '早良': {2035: 227, 2040: 228, 2045: 228, 2050: 226},
    '西': {2035: 219, 2040: 220, 2045: 219, 2050: 218},
}
NOTE = ('区別ページの年齢階層別内訳は2020–2034年のみ（PDF実測）。2035–2050年は内訳が無いため推計値：'
        '区別総人口（棒グラフ画像から書き起こした5年刻みの千人値を年次線形補間し、全市総人口に合わせて按分）と'
        '全市の年齢階層別人口（PDF実測）を周辺和とし、前年の区別構成を初期値にIPF（反復比例調整）で配分、100人単位に丸め。'
        'estimated_years を参照。')
NUM = re.compile(r'^\d{1,3}(,\d{3})*(\.\d)?$')


def norm_band(s):
    s = re.sub(r'\s+', '', s).replace('~', '～')
    return s if s in BANDS else None


def parse_page(page):
    """-> {(sex, year): {band: 人}}"""
    toks = [t.strip() for t in page.get_text().split('\n') if t.strip()]
    out = {}
    years, sex, i = [], None, 0
    while i < len(toks):
        t = toks[i]
        m = re.fullmatch(r'(\d{4})年', t)
        if m:
            if i and re.fullmatch(r'(\d{4})年', toks[i - 1]) is None and \
                    not (i >= 2 and re.fullmatch(r'\d{4}年', toks[i - 2]) and toks[i - 1].startswith(('(', '（'))):
                years = []
            years.append(int(m.group(1)))
            i += 1
            continue
        if t in ('男性', '女性'):
            sex = t
            i += 1
            continue
        b = norm_band(t)
        if b and sex and years:
            vals = []
            j = i + 1
            while j < len(toks) and len(vals) < len(years) and NUM.match(toks[j]):
                vals.append(toks[j])
                j += 1
            if len(vals) != len(years):
                raise ValueError(f'{t}: {len(vals)} values, expected {len(years)}')
            for y, v in zip(years, vals):
                out.setdefault((sex, y), {})[b] = round(float(v.replace(',', '')) * 1000)
            i = j
            continue
        i += 1
    return out


def merge(pages):
    res = {}
    for p in pages:
        d = parse_page(p)
        for (sex, y), bands in d.items():
            if sex == '男性':
                f = d[('女性', y)]
                res[y] = {b: bands[b] + f[b] for b in BANDS}
    return res


def estimate(wards, city, years):
    """2035以降の区×帯を、前年構成を種にIPFで推計（全市帯別・区別総人口が周辺和）"""
    ks = sorted(WARD_TOTALS_K['東'])
    for y in years:
        if y in wards['東']:
            continue
        ctot = sum(city[y].values())
        raw = {}
        for w in WARDS:
            lo = max(k for k in ks if k <= y) if y >= ks[0] else None
            hi = min(k for k in ks if k >= y)
            raw[w] = WARD_TOTALS_K[w][lo] if lo == hi else (
                WARD_TOTALS_K[w][lo] + (WARD_TOTALS_K[w][hi] - WARD_TOTALS_K[w][lo]) * (y - lo) / (hi - lo))
        k = ctot / (1000 * sum(raw.values()))
        rt = {w: raw[w] * 1000 * k for w in WARDS}
        m = {w: {b: wards[w][y - 1][b] * city[y][b] / city[y - 1][b] for b in BANDS} for w in WARDS}
        for _ in range(200):
            for w in WARDS:
                f = rt[w] / sum(m[w].values())
                m[w] = {b: v * f for b, v in m[w].items()}
            for b in BANDS:
                f = city[y][b] / sum(m[w][b] for w in WARDS)
                for w in WARDS:
                    m[w][b] *= f
        for w in WARDS:
            wards[w][y] = {b: int(round(m[w][b] / 100.0)) * 100 for b in BANDS}


def extract(pdf):
    doc = pymupdf.open(str(pdf))
    city = merge([doc[i] for i in CITY_PAGES])
    wards = {}
    for i in WARD_PAGES:
        txt = doc[i].get_text()
        name = next(w for w in WARDS if re.search(rf'(?m)^\s*{w}区\s*$', txt))
        wards[name] = merge([doc[i]])
    years = list(range(2020, 2051))
    for w in WARDS:
        wards[w] = {y: v for y, v in wards[w].items() if y <= 2034}
    estimate(wards, city, years)
    return {
        'years': years,
        'bands': BANDS,
        'city': {str(y): city[y] for y in sorted(city)},
        'wards': {w: {str(y): wards[w][y] for y in years} for w in WARDS},
        'source': SOURCE,
        'estimated_years': list(range(2035, 2051)),
        '_note': NOTE,
    }


if __name__ == '__main__':
    pdf = pathlib.Path(sys.argv[1])
    out = pathlib.Path(__file__).resolve().parent / 'projection.json'
    out.write_text(json.dumps(extract(pdf), ensure_ascii=False, indent=1), encoding='utf-8')
