// Generates simple PWA icons (PNG) without external dependencies.
// Run with: node scripts/generate-icons.mjs
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public');

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[n]) & 0xff];
    crc = c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), rowStart + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function makeCanvas(w, h) {
  const d = new Uint8Array(w * h * 4);
  const setPx = (x, y, r, g, b, a) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
  };
  const circle = (ccx, ccy, cr, rgba) => {
    const [fr, fg, fb, fa] = rgba;
    const r1 = Math.max(0, cr - 0.5);
    const r2 = Math.max(0, cr + 0.5);
    for (let py = Math.ceil(ccy - r2); py < ccy + r2; py++) {
      for (let px = Math.ceil(ccx - r2); px < ccx + r2; px++) {
        const dx = px - ccx, dy = py - ccy;
        if (dx * dx + dy * dy <= (cr - 0.5) * (cr - 0.5) || dx * dx + dy * dy <= (cr + 0.5) * (cr + 0.5)) {
          setPx(px, py, fr, fg, fb, fa);
        }
      }
    }
  };
  const fillRoundRect = (x, y, rw, rh, r, rgba) => {
    const [fr, fg, fb, fa] = rgba;
    const x0 = x, y0 = y;
    const rrw = rw, rrh = rh, rr = r;
    for (let py = Math.ceil(y0); py < Math.ceil(y0 + rrh); py++) {
      for (let px = Math.ceil(x0); px < Math.ceil(x0 + rrw); px++) {
        const inside = px + 0.51 >= x0 + rr && px - 0.51 <= x0 + rrw - rr && py + 0.51 >= y0 + rr && py - 0.51 <= y0 + rrh - rr;
        if (inside) setPx(px, py, fr, fg, fb, fa);
      }
    }
    circle(x0 + rr, y0 + rr, rr, [fr, fg, fb, fa]);
    circle(x0 + rrw - rr, y0 + rr, rr, [fr, fg, fb, fa]);
    circle(x0 + rr, y0 + rrh - rr, rr, [fr, fg, fb, fa]);
    circle(x0 + rrw - rr, y0 + rrh - rr, rr, [fr, fg, fb, fa]);
  };
  return { d, setPx, circle, fillRoundRect };
}

function renderIcon(size, s) {
  const c = makeCanvas(size, size);
  const X = (x) => Math.round(x * s);
  const Y = (y) => Math.round(y * s);
  const W = (w) => Math.round(w * s);
  const H = (h) => Math.round(h * s);
  const R = (r) => Math.round(r * s);
  const BLUE = [0x25, 0x63, 0xeb, 0xff];
  const BLUE_DARK = [0x1d, 0x4e, 0xd8, 0xff];
  const BLUE_RING = [0x1e, 0x40, 0xaf, 0xff];
  const WHITE = [0xff, 0xff, 0xff, 0xff];
  const LIGHT_BLUE = [0xbf, 0xdb, 0xfe, 0xff];
  c.fillRoundRect(0, 0, size, size, R(0.2), BLUE);
  c.circle(X(0.22), Y(0.16), R(0.05), BLUE_RING);
  c.circle(X(0.78), Y(0.16), R(0.05), BLUE_RING);
  c.fillRoundRect(X(0.08), Y(0.16), W(0.84), H(0.18), R(0.1), BLUE_DARK);
  c.fillRoundRect(X(0.08), Y(0.34), W(0.84), H(0.54), R(0.1), WHITE);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      c.circle(X(0.2 + col * 0.18), Y(0.44 + row * 0.13), R(0.035), LIGHT_BLUE);
    }
  }
  return c.d;
}

function writeIcon(file, size) {
  const rgba = renderIcon(size, size);
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(path.join(outDir, file), png);
  console.log('wrote', file, size);
}

fs.mkdirSync(outDir, { recursive: true });
writeIcon('icon-192.png', 192);
writeIcon('icon-512.png', 512);

function renderMaskable(size) {
  const s = size * 0.78;
  const ox = (size - s) / 2;
  const oy = (size - s) / 2;
  const c = makeCanvas(size, size);
  const X = (x) => Math.round(ox + x * s);
  const Y = (y) => Math.round(oy + y * s);
  const W = (w) => Math.round(w * s);
  const H = (h) => Math.round(h * s);
  const R = (r) => Math.round(r * s);
  const BLUE = [0x25, 0x63, 0xeb, 0xff];
  const BLUE_DARK = [0x1d, 0x4e, 0xd8, 0xff];
  const BLUE_RING = [0x1e, 0x40, 0xaf, 0xff];
  const WHITE = [0xff, 0xff, 0xff, 0xff];
  const LIGHT_BLUE = [0xbf, 0xdb, 0xfe, 0xff];
  c.fillRoundRect(0, 0, size, size, R(0.2), BLUE);
  c.circle(X(0.22), Y(0.16), R(0.05), BLUE_RING);
  c.circle(X(0.78), Y(0.16), R(0.05), BLUE_RING);
  c.fillRoundRect(X(0.08), Y(0.16), W(0.84), H(0.18), R(0.1), BLUE_DARK);
  c.fillRoundRect(X(0.08), Y(0.34), W(0.84), H(0.54), R(0.1), WHITE);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      c.circle(X(0.2 + col * 0.18), Y(0.44 + row * 0.13), R(0.035), LIGHT_BLUE);
    }
  }
  return c.d;
}

{
  const d = renderMaskable(512);
  const png = encodePNG(512, 512, d);
  fs.writeFileSync(path.join(outDir, 'icon-512-maskable.png'), png);
  console.log('wrote icon-512-maskable.png');
}
