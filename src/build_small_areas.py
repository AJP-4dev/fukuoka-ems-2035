"""福岡市の小地域（1kmメッシュ）別の夜間人口・従業者数 → src/small_areas.json

町丁・字等の従業地人口は 2020 国勢調査の小地域集計では公開されていないため、e-Stat「地域メッシュ統計」を使う。
  night = 令和2年国勢調査 地域メッシュ統計 人口等基本集計 3次メッシュ(1km) 人口総数  (statsId T001100)
  work  = 令和3年経済センサス-活動調査 地域メッシュ統計 3次メッシュ(1km) 全産業 従業者数 (statsId T001149)
どちらも福岡県一括 CSV(txt) を src/raw/estat/ に置く。区の境界は e-Stat 境界データ(令和2年国勢調査 小地域 shapefile, 町丁ポリゴン)の
区ごとの合併で、1km メッシュ（矩形）を区ポリゴンとの交差面積比で按分し、交差部分の重心を代表点にする。
"""
import struct

import csv
import json
import pathlib
import urllib.request

from shapely.geometry import Polygon, box
from shapely.ops import unary_union

HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE / 'raw' / 'estat'
URL = 'https://www.e-stat.go.jp/gis/statmap-search/data?statsId={}&code=40&downloadType=2'
TABLES = {'night': ('T001100', 'tblT001100S40.txt'), 'work': ('T001149', 'tblT001149S40.txt')}
BURL = ('https://www.e-stat.go.jp/gis/statmap-search/data?dlserveyId=A002005212020&code={}'
        '&coordSys=1&format=shape&downloadType=5&datum=2000')
WARD_CODE = {'東': '40131', '博多': '40132', '中央': '40133', '南': '40134', '西': '40135', '城南': '40136', '早良': '40137'}
MIN_SHARE = 0.02  # メッシュのうちこの割合未満しか区に掛からない断片は捨てる


def ward_polygon(code):
    """境界 shapefile(Polygon型5) を読み、町丁ポリゴンを合併して区ポリゴンにする（標準ライブラリ+shapely）。"""
    import io
    import zipfile
    p = RAW / 'boundary' / f'r2ka{code}.shp'
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(BURL.format(code), timeout=120) as r:
            z = zipfile.ZipFile(io.BytesIO(r.read()))
            for n in z.namelist():
                if n.endswith(('.shp', '.dbf', '.prj')):
                    (p.parent / n).write_bytes(z.read(n))
    d = p.read_bytes()
    pos, polys = 100, []
    while pos < len(d):
        clen = struct.unpack('>i', d[pos + 4:pos + 8])[0] * 2
        rec = d[pos + 8:pos + 8 + clen]
        pos += 8 + clen
        if struct.unpack('<i', rec[:4])[0] != 5:
            continue
        nparts, npts = struct.unpack('<ii', rec[36:44])
        parts = list(struct.unpack(f'<{nparts}i', rec[44:44 + 4 * nparts])) + [npts]
        o = 44 + 4 * nparts
        pts = [struct.unpack('<2d', rec[o + 16 * i:o + 16 * i + 16]) for i in range(npts)]
        for a, b in zip(parts, parts[1:]):
            polys.append(Polygon(pts[a:b]).buffer(0))
    return unary_union(polys)


def fetch(sid, fname):
    p = RAW / fname
    if not p.exists():
        import io
        import zipfile
        RAW.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(URL.format(sid), timeout=120) as r:
            zipfile.ZipFile(io.BytesIO(r.read())).extract(fname, RAW)
    return p


def read_col(path, col):
    """KEY_CODE -> 第col列(0始まりでKEY_CODEの次が1)。秘匿は空欄/X として 0。"""
    out = {}
    for r in list(csv.reader(open(path, encoding='cp932', errors='replace')))[2:]:
        v = r[col].strip() if len(r) > col else ''
        out[r[0]] = int(v) if v.isdigit() else 0
    return out


def mesh_center(code):
    p, u, q, v, r, w = int(code[0:2]), int(code[2:4]), int(code[4]), int(code[5]), int(code[6]), int(code[7])
    lat = p / 1.5 + q * 5 / 60 + r * 30 / 3600 + 15 / 3600
    lon = 100 + u + v * 7.5 / 60 + w * 45 / 3600 + 22.5 / 3600
    return round(lon, 5), round(lat, 5)


def build():
    polys = {nm: ward_polygon(c) for nm, c in WARD_CODE.items()}
    night = read_col(fetch(*TABLES['night']), 4)   # 人口（総数）
    work = read_col(fetch(*TABLES['work']), 108)   # Ａ～Ｓ全産業 従業者数
    areas = []
    for k in sorted(set(night) | set(work)):
        n, w = night.get(k, 0), work.get(k, 0)
        if n + w == 0:
            continue
        lon, lat = mesh_center(k)
        cell = box(lon - 22.5 / 3600, lat - 15 / 3600, lon + 22.5 / 3600, lat + 15 / 3600)
        for nm, pg in polys.items():
            if not cell.intersects(pg):
                continue
            part = cell.intersection(pg)
            sh = part.area / cell.area
            if sh < MIN_SHARE:
                continue
            c = part.centroid
            areas.append({'key': k, 'ward': nm, 'lon': round(c.x, 5), 'lat': round(c.y, 5),
                          'night': round(n * sh, 1), 'work': round(w * sh, 1)})
    return {'_source': {'night': '令和2年国勢調査 地域メッシュ統計(人口等基本集計・3次メッシュ) e-Stat statsId=T001100',
                        'work': '令和3年経済センサス-活動調査 地域メッシュ統計(3次メッシュ・全産業従業者数) e-Stat statsId=T001149',
                        'url': 'https://www.e-stat.go.jp/gis/statmap-search/data?statsId=<id>&code=40&downloadType=2',
                        'note': '町丁・字等の従業地人口は公表されていないため 1km メッシュ(従業者数)で代替。区境は境界データ(小地域shapefile)を合併して使用'},
            '_note': '町丁・字等の従業地人口表が公表されていないため、1kmメッシュ（国勢調査2020人口＋経済センサス2021従業者数）を採用。按分は最寄り署所方式のため、西戸崎出張所（389件/隊：小さな半島の受け持ち）は低め、堅粕出張所（6,469件/隊：博多駅東側のオフィス街が隊1の署所に集中）は高めに出る。実際の出場は署所をまたいで最寄りの空き隊が対応するため上限寄りの推定。',
            '_method': 'mesh (JIS X 0410) split by area share of each ward polygon; representative point = centroid of the intersection',
            'areas': areas}


if __name__ == '__main__':
    out = build()
    (HERE / 'small_areas.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    A = out['areas']
    print(len(A), 'cells; night', sum(a['night'] for a in A), 'work', sum(a['work'] for a in A))
