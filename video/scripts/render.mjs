// Deterministic renderer: static server -> Playwright chromium -> seek(t) -> PNG -> ffmpeg
// Usage:
//   node scripts/render.mjs                      # full render -> out/fukuoka-ems-2035.mp4 (video-only: out/video-only.mp4)
//   node scripts/render.mjs --frames 0,30,300    # stills -> out/frames/f-<n>.png
//   node scripts/render.mjs --start 0 --end 180  # partial render (frames) -> out/video-only.mp4
//   node scripts/render.mjs --scale 0.5          # draft at half resolution
//   node scripts/render.mjs --scene src/starlight.html --audio audio/starlight_sync.mp3 --out starlight.mp4
//   --framesdir out/frames-xxx   # stills dir;  --out NAME.mp4 also names the partial video NAME-video-only.mp4
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 30;
const W = 1920, H = 1080;

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const framesArg = opt('--frames', null);
const scale = parseFloat(opt('--scale', '1'));
const startF = parseInt(opt('--start', '0'), 10);
const endArg = opt('--end', null);
const scenePath = opt('--scene', 'src/scene.html');
const audioPath = opt('--audio', 'audio/mix.wav');
const outName = opt('--out', 'fukuoka-ems-2035.mp4');
const framesDir = opt('--framesdir', 'out/frames');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wav': 'audio/wav', '.png': 'image/png' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

async function main() {
  const { srv, port } = await serve();
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'],
  });
  const page = await browser.newPage({ viewport: { width: Math.round(W * scale), height: Math.round(H * scale) }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/${scenePath}`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.seek === 'function' && typeof window.DURATION === 'number', null, { timeout: 30000 });
  if (scale !== 1) await page.evaluate((s) => { document.documentElement.style.zoom = String(s); }, scale);
  const DURATION = await page.evaluate(() => window.DURATION);
  const total = Math.round(DURATION * FPS);
  console.log(`scene ok: DURATION=${DURATION}s, frames=${total}, scale=${scale}`);

  const shot = async (f) => {
    await page.evaluate((t) => window.seek(t), f / FPS);
    return page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
  };

  if (framesArg) {
    const dir = path.join(ROOT, framesDir); fs.mkdirSync(dir, { recursive: true });
    for (const f of framesArg.split(',').map(Number)) {
      fs.writeFileSync(path.join(dir, `f-${String(f).padStart(4, '0')}.png`), await shot(f));
      console.log(`frame ${f} (t=${(f / FPS).toFixed(2)}s)`);
    }
  } else {
    const endF = endArg ? parseInt(endArg, 10) : total;
    const partial = startF !== 0 || endF !== total;
    const outVideo = path.join(ROOT, 'out', outName === 'fukuoka-ems-2035.mp4' ? 'video-only.mp4' : outName.replace(/\.mp4$/, '') + '-video-only.mp4');
    fs.mkdirSync(path.dirname(outVideo), { recursive: true });
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outVideo], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = startF; f < endF; f++) {
      const buf = await shot(f);
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 150 === 0) console.log(`frame ${f}/${endF}  ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
    }
    ff.stdin.end();
    await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
    console.log(`video-only done: ${outVideo}`);
    const mix = path.join(ROOT, audioPath);
    if (!partial && fs.existsSync(mix)) {
      const final = path.join(ROOT, 'out', outName);
      const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', outVideo, '-i', mix, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final], { stdio: 'inherit' });
      if (r.status !== 0) throw new Error('mux failed');
      console.log(`final: ${final}`);
    }
  }
  await browser.close();
  srv.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
