// 開発用: 0.5秒ごとに縮小画像を取り、章レールを除いて「変化なし」が3秒以上続く区間を探す
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const srv = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript' }); fs.createReadStream(p).pipe(res); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://127.0.0.1:${srv.address().port}/src/scene.html`);
await page.waitForFunction(() => typeof window.seek === 'function');
const D = await page.evaluate(() => window.DURATION);
await page.evaluate(() => { window.__sm = document.createElement('canvas'); window.__sm.width = 192; window.__sm.height = 102; });
let prev = null, still = 0, start = 0;
for (let t = 0; t < D; t += 0.5) {
  const arr = await page.evaluate(async (t) => {
    await window.seek(t); const c = window.__sm, x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, 192, 102);
    const gl = document.getElementById('gl'); if (gl.style.display !== 'none') x.drawImage(gl, 0, 60, 1920, 1020, 0, 0, 192, 102);
    x.drawImage(document.getElementById('cv'), 0, 60, 1920, 1020, 0, 0, 192, 102);
    return Array.from(x.getImageData(0, 0, 192, 102).data.filter((v, i) => i % 4 === 1));
  }, t);
  if (prev) {
    let d = 0; for (let i = 0; i < arr.length; i++) d += Math.abs(arr[i] - prev[i]);
    if (d < 40) { if (!still) start = t - 0.5; still += 0.5; } else { if (still >= 3) console.log(`STILL ${start.toFixed(1)}–${(t - 0.5).toFixed(1)}s (${still}s)`); still = 0; }
  }
  prev = arr;
}
await browser.close(); srv.close();
