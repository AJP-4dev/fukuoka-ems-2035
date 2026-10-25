"""template.html / slides_template.html の /*__DATA__*/ に data.js を注入して index.html / slides.html を生成"""
import pathlib
R = pathlib.Path(__file__).parent.parent
d = (R / 'data.js').read_text(encoding='utf-8').rstrip('\n')
for src, dst in (('template.html', 'index.html'), ('slides_template.html', 'slides.html')):
    t = (R / src).read_text(encoding='utf-8')
    assert t.count('/*__DATA__*/') == 1, src
    (R / dst).write_text(t.replace('/*__DATA__*/', d), encoding='utf-8')
    print(dst, (R / dst).stat().st_size, 'bytes')
