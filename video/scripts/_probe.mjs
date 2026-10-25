// QA: 全編を一定間隔で seek して、チップ数・字幕長・文字のはみ出し・描画時間を調べる（開発用）
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srv = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript' }); fs.createReadStream(p).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
await page.goto(`http://127.0.0.1:${srv.address().port}/src/scene.html`);
await page.waitForFunction(() => typeof window.seek === 'function');
const D = await page.evaluate(() => window.DURATION);
const step = parseFloat(process.argv[2] || '0.25');
const subs = await page.evaluate(() => window.__dbg().subs);
for (const [a, b, s] of subs) if ([...s].length > 22) console.log('SUB>22', s, [...s].length);
let maxChips = 0; const oob = new Map(); const times = {};
for (let t = 0; t < D; t += step) {
  const r = await page.evaluate(async (t) => { const t0 = performance.now(); await window.seek(t); const d = window.__dbg(); return { ms: performance.now() - t0, chips: d.chips, ci: d.ci, texts: d.texts }; }, t);
  (times[r.ci] ||= []).push(r.ms);
  if (r.chips > 3) console.log('CHIPS>3 at', t.toFixed(2), r.chips);
  maxChips = Math.max(maxChips, r.chips);
  for (const [s, x0, y0, x1, y1] of r.texts) if (x0 < 79 || x1 > 1841 || y0 < 60 || y1 > 1001) { const k = s + ' @ch' + r.ci; if (!oob.has(k)) oob.set(k, [t.toFixed(2), Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)]); }
}
console.log('maxChips', maxChips);
for (const [k, v] of oob) console.log('OOB', k, v.join(' '));
for (const [ci, a] of Object.entries(times)) console.log('ch', ci, 'avg ms', (a.reduce((p, c) => p + c, 0) / a.length).toFixed(1), 'max', Math.max(...a).toFixed(0));
await browser.close(); srv.close();
