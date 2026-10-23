"""template.html の /*__DATA__*/ に data.js を注入して index.html を生成"""
import pathlib
R = pathlib.Path(__file__).parent.parent
t = (R / 'template.html').read_text(encoding='utf-8')
d = (R / 'data.js').read_text(encoding='utf-8').rstrip('\n')
assert t.count('/*__DATA__*/') == 1
(R / 'index.html').write_text(t.replace('/*__DATA__*/', d), encoding='utf-8')
print('index.html', (R / 'index.html').stat().st_size, 'bytes')
