import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
WARDS = ['東', '博多', '中央', '南', '城南', '早良', '西']


def load(name):
    return json.load(open(ROOT / 'src' / name, encoding='utf-8'))
