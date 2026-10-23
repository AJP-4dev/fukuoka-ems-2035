"""福岡市の将来人口推計PDF -> projection.json（pymupdfのテキスト層から抽出）"""
import json
import pathlib
import re
import sys

import pymupdf

IPSS_PAGE = 'https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp'
IPSS_URL = 'https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/3kekka/suikei_kekka.xlsx'
BANDS = [f'{a}～{a + 4}歳' for a in range(0, 90, 5)] + ['90歳以上']
WARDS = ['東', '博多', '中央', '南', '城南', '早良', '西']
CITY_PAGES = [13, 14, 15, 16]
WARD_PAGES = list(range(19, 26))
SOURCE = ('福岡市の将来人口推計（令和6年4月）p10–22（全市は男女別・年齢階層別内訳、'
          '区別は同内訳）。2051–2065年は全市の参考値。区別2035–2050年は社人研 令和5年推計の区シェアによる推計'
          f'（{IPSS_PAGE} の表「都道府県・市区町村別の男女･年齢（5歳）階級別将来推計人口」Sheet1、{IPSS_URL}）。')
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
NOTE = ('市推計PDFの区別表は全市表と帯別で最大約8,000人食い違うため、帯ごとに全市表へ比例配分して整合させた（2020–2034年。Σ区＝全市）。'
        '区別ページの年齢階層別内訳は2020–2034年のみ（PDF実測）。2035–2050年は社人研『日本の地域別将来推計人口'
        '（令和5年推計）』の区別×5歳階級の区シェアを年次線形補間し、福岡市推計（PDF）の全市帯別人口に乗じた推計値で、'
        '整合後の2034年値との段差は2050年にかけて線形に解消。chartTotalsは区別ページ棒グラフ（画像）の書き起こしで検算用。')
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
                raise ValueError(f'p{page.number}: {t}: {len(vals)} values, expected {len(years)}')
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


IPSS_DEFAULT = pathlib.Path(__file__).resolve().parent / 'raw' / 'ipss' / 'suikei_kekka.xlsx'


def load_ipss(xlsx):
    # 出典: 社人研『日本の地域別将来推計人口（令和5年推計）』
    #   ページ IPSS_PAGE ／ 3.都道府県・市区町村別の男女･年齢（5歳）階級別将来推計人口（Sheet1）
    #   ファイル IPSS_URL（コード40131-40137=福岡市各区、市などの別=0）
    if not pathlib.Path(xlsx).exists():
        raise FileNotFoundError(
            f'社人研 令和5年推計のExcelが見つかりません: {xlsx}\n'
            f'ダウンロード元: {IPSS_URL}\n（ページ: {IPSS_PAGE}）')
    """社人研 令和5年推計: {ward: {year5: {band: 人}}}（男女計、90歳以上=90～94+95歳～）"""
    import openpyxl
    wb = openpyxl.load_workbook(str(xlsx), read_only=True)
    out = {}
    for r in wb.worksheets[0].iter_rows(values_only=True):
        if r[1] == 0 and r[2] == '福岡県' and r[3] and r[3].startswith('福岡市'):
            w = r[3][3:-1]
            y = int(r[4][:4])
            v = list(r[6:26])  # 0～4 ... 90～94, 95～
            vals = v[:18] + [v[18] + v[19]]
            out.setdefault(w, {})[y] = dict(zip(BANDS, vals))
    return out


def share(ipss, w, b, y):
    """区シェア（IPSSの5年点を線形補間）"""
    def s5(yy):
        return ipss[w][yy][b] / sum(ipss[x][yy][b] for x in WARDS)
    lo = y // 5 * 5
    if y == lo:
        return s5(lo)
    return s5(lo) + (s5(lo + 5) - s5(lo)) * (y - lo) / 5


def reconcile(wards, city):
    """2020–2034: 区別表の帯別人口を、帯ごとに全市表の帯合計へ比例配分して整合させる（Σ区＝市を厳密に。丸め残差は最大区へ）。
    市推計PDFの区別表は全市表と帯別で最大約8,000人食い違う（20代の移動仮定）ため。"""
    for y in range(2020, 2035):
        for b in BANDS:
            raw = {w: wards[w][y][b] for w in WARDS}
            tot = sum(raw.values())
            vals = {w: int(round(city[y][b] * raw[w] / tot)) for w in WARDS}
            big = max(WARDS, key=lambda w: vals[w])
            vals[big] += city[y][b] - sum(vals.values())
            for w in WARDS:
                wards[w][y][b] = vals[w]


def estimate(wards, city, years, ipss):
    """2035–2050: 全市(PDF)×社人研の区シェア、2034実測との段差を2050にかけて線形に解消"""
    r = {w: {b: wards[w][2034][b] / (city[2034][b] * share(ipss, w, b, 2034))
             for b in BANDS} for w in WARDS}
    for y in years:
        if y <= 2034:
            continue
        for w in WARDS:
            wards[w][y] = {}
        for b in BANDS:
            f = {w: share(ipss, w, b, y) * (1 + (r[w][b] - 1) * (2050 - y) / (2050 - 2034))
                 for w in WARDS}
            tot = sum(f.values())
            vals = {w: int(round(city[y][b] * f[w] / tot)) for w in WARDS}
            big = max(WARDS, key=lambda w: vals[w])
            vals[big] += city[y][b] - sum(vals.values())
            for w in WARDS:
                wards[w][y][b] = vals[w]


def extract(pdf, ipss=None):
    doc = pymupdf.open(str(pdf))
    city = merge([doc[i] for i in CITY_PAGES])
    wards = {}
    for i in WARD_PAGES:
        txt = doc[i].get_text()
        name = next((w for w in WARDS if re.search(rf'(?m)^\s*{w}区\s*$', txt)), None)
        if name is None:
            raise ValueError(f'p{i}: 区名（東区〜西区）が見つかりません')
        wards[name] = merge([doc[i]])
    years = list(range(2020, 2051))
    for w in WARDS:
        wards[w] = {y: v for y, v in wards[w].items() if y <= 2034}
    reconcile(wards, city)
    ipss = load_ipss(ipss or IPSS_DEFAULT)
    estimate(wards, city, years, ipss)
    return {
        'years': years,
        'bands': BANDS,
        'city': {str(y): city[y] for y in sorted(city)},
        'wards': {w: {str(y): wards[w][y] for y in years} for w in WARDS},
        'source': SOURCE,
        'estimated_years': list(range(2035, 2051)),
        '_note': NOTE,
        'chartTotals': {w: {str(y): v * 1000 for y, v in WARD_TOTALS_K[w].items()} for w in WARDS},
    }


if __name__ == '__main__':
    pdf = pathlib.Path(sys.argv[1])
    ipss_path = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else IPSS_DEFAULT
    out = pathlib.Path(__file__).resolve().parent / 'projection.json'
    out.write_text(json.dumps(extract(pdf, ipss_path), ensure_ascii=False, indent=1), encoding='utf-8')
