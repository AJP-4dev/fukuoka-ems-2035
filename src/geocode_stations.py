"""署所30か所＋機動救急を国土地理院APIでジオコーディングし stations.json に固定する（一度だけ実行・ビルド時は不要）。
住所は https://www.city.fukuoka.lg.jp/syobo/somu/about/syozaiti.html（2026-10-23取得）。
units は 年報R6 第1-4-2表（R7.3.31現在）。手修正した座標は FIX に記録。"""
import json
import pathlib
import urllib.parse
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
API = 'https://msearch.gsi.go.jp/address-search/AddressSearch?q='
P = '福岡市'
# (id, name, kind, ward, address, units)
ST = [
    ('higashi', '東消防署', '署', '東', P + '東区千早4丁目15番1号', 2),
    ('saitozaki', '西戸崎出張所', '出張所', '東', P + '東区西戸崎6丁目4番4号', 1),
    ('wajiro', '和白出張所', '出張所', '東', P + '東区和白3丁目28番33号', 1),
    ('tatara', '多々良出張所', '出張所', '東', P + '東区土井1丁目23番21号', 1),
    ('hakozaki', '箱崎出張所', '出張所', '東', P + '東区箱崎6丁目5番12号', 1),
    ('suijo', '水上出張所', '出張所', '東', P + '東区東浜2丁目1番53号', 1),
    ('hakata', '博多消防署', '署', '博多', P + '博多区博多駅前4丁目19番7号', 2),
    ('kuko', '空港出張所', '出張所', '博多', P + '博多区上臼井454番1号', 1),
    ('katakasu', '堅粕出張所', '出張所', '博多', P + '博多区堅粕2丁目13番7号', 1),
    ('reisen', '冷泉出張所', '出張所', '博多', P + '博多区上川端8番2号', 0),
    ('kamimuta', '上牟田出張所', '出張所', '博多', P + '博多区上牟田3丁目11番10号', 1),
    ('itazuke', '板付出張所', '出張所', '博多', P + '博多区板付2丁目5番6号', 1),
    ('nakaminami', '那珂南出張所', '出張所', '博多', P + '博多区西春町1丁目1番50号', 1),
    ('chuo', '中央消防署', '署', '中央', P + '中央区那の津2丁目5番1号', 2),
    ('hirao', '平尾出張所', '出張所', '中央', P + '中央区平尾2丁目6番5号', 2),
    ('sasaoka', '笹丘出張所', '出張所', '中央', P + '中央区笹丘1丁目10番18号', 0),
    ('minami', '南消防署', '署', '南', P + '南区塩原2丁目6番11号', 2),
    ('hanahata', '花畑出張所', '出張所', '南', P + '南区若久5丁目25番3号', 0),
    ('osa', '曰佐出張所', '出張所', '南', P + '南区的場2丁目26番1号', 1),
    ('hibaru', '桧原出張所', '出張所', '南', P + '南区桧原1丁目33番39号', 1),
    ('jonan', '城南消防署', '署', '城南', P + '城南区神松寺2丁目19番12号', 2),
    ('iikura', '飯倉出張所', '出張所', '城南', P + '城南区飯倉1丁目7番20号', 1),
    ('sawara', '早良消防署', '署', '早良', P + '早良区百道浜1丁目3番1号', 2),
    ('takuma', '田隈出張所', '出張所', '早良', P + '早良区野芥7丁目2番26号', 1),
    ('muromi', '室見出張所', '出張所', '早良', P + '早良区南庄1丁目12番18号', 0),
    ('higashiirube', '東入部出張所', '出張所', '早良', P + '早良区東入部7丁目20番6号', 1),
    ('nishi', '西消防署', '署', '西', P + '西区今宿東1丁目7番12号', 1),
    ('meinohama', '姪浜出張所', '出張所', '西', P + '西区姪浜4丁目1番19号', 1),
    ('iki', '壱岐出張所', '出張所', '西', P + '西区野方1丁目14番4号', 1),
    ('motooka', '元岡出張所', '出張所', '西', P + '西区元岡633番2号', 1),
]
# 機動救急（消防本部）は中央消防署と同じ扱い（座標は中央消防署に合わせる）
FIX = {}  # id -> (lon, lat) 手修正


def geocode(addr):
    with urllib.request.urlopen(API + urllib.parse.quote(addr), timeout=30) as r:
        f = json.load(r)
    if not f:
        raise RuntimeError('no result: ' + addr)
    lon, lat = f[0]['geometry']['coordinates']
    return round(lon, 5), round(lat, 5), f[0]['properties'].get('title')


def main():
    out = []
    for i, name, kind, ward, addr, units in ST:
        lon, lat, title = geocode(addr)
        print(i, addr, '->', title, lon, lat)
        if i in FIX:
            lon, lat = FIX[i]
        out.append({'id': i, 'name': name, 'kind': kind, 'ward': ward, 'address': addr,
                    'lon': lon, 'lat': lat, 'units': units})
    c = next(s for s in out if s['id'] == 'chuo')
    out.append({'id': 'kido', 'name': '機動救急', 'kind': '本部', 'ward': '中央', 'address': c['address'],
                'lon': c['lon'], 'lat': c['lat'], 'units': 1})
    (HERE / 'stations.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
