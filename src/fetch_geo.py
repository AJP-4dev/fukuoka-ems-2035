"""福岡市7区の境界GeoJSON(niiyz/JapanCityGeoJson)を取得し、間引いて wards_geo.json を作る。"""
import json
import pathlib
import urllib.request
from shapely.geometry import Polygon

HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE / 'raw' / 'geo'
URL = 'https://raw.githubusercontent.com/niiyz/JapanCityGeoJson/master/geojson/40/{code}.json'
# 福岡市の区コード（JIS）。niiyz のファイル内 N03_004 で区名を照合する
WARD_CODES = [('東', '40131'), ('博多', '40132'), ('中央', '40133'), ('南', '40134'),
              ('城南', '40136'), ('早良', '40137'), ('西', '40135')]
TOL = 0.0008


def fetch(code):
    RAW.mkdir(parents=True, exist_ok=True)
    p = RAW / f'{code}.json'
    if not p.exists():
        with urllib.request.urlopen(URL.format(code=code), timeout=60) as r:
            p.write_bytes(r.read())
    return json.load(open(p, encoding='utf-8'))


def ring(poly):
    return [[round(x, 4), round(y, 4)] for x, y in poly.exterior.coords]


def build():
    wards = []
    for name, code in WARD_CODES:
        d = fetch(code)
        names = {f['properties'].get('N03_004') for f in d['features']}
        assert names == {name + '区'}, (code, names)
        # 東区・西区のファイルは島や本土の輪が「穴」として1ポリゴンに詰め込まれているため、
        # 全ての輪を独立のポリゴンとして扱い面積順に並べる（小さな穴・飛び地は2%基準で落ちる）
        geom = d['features'][0]['geometry']
        rs = [r for poly in (geom['coordinates'] if geom['type'] == 'MultiPolygon' else [geom['coordinates']])
              for r in poly]
        polys = sorted((Polygon(r).buffer(0) for r in rs if len(r) >= 4), key=lambda p: -p.area)
        polys = [p for p in polys if p.geom_type == 'Polygon']
        main = polys[0]
        keep = [main] + [p for p in polys[1:] if p.area > main.area * 0.02]
        rings = []
        for p in keep:
            s = Polygon(p.exterior).simplify(TOL, preserve_topology=True)
            if s.geom_type == 'Polygon' and len(s.exterior.coords) >= 4:
                rings.append(ring(s))
        cen = Polygon(rings[0]).centroid
        wards.append({'name': name, 'code': code, 'c': [round(cen.x, 4), round(cen.y, 4)], 'rings': rings})
    # 区の並びは WARDS 順（東・博多・中央・南・城南・早良・西）
    return {'wards': wards}


if __name__ == '__main__':
    out = build()
    (HERE / 'wards_geo.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    for w in out['wards']:
        print(w['name'], w['code'], w['c'], [len(r) for r in w['rings']])
