/**
 * 1200×630 OG placeholders with brand + label (no canvas deps).
 * Replace with designed art before promo push if you want.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'og');
mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 630;

/** 5×7 uppercase bitmap font (A–Z, 0–9, space, hyphen, colon) */
const FONT = {
  ' ': [],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
};

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(pixels /* Uint8Array RGB length W*H*3 */) {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const rowStart = y * (1 + W * 3);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function fill(pixels, r, g, b) {
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }
}

function rect(pixels, x, y, w, h, r, g, b) {
  for (let yy = y; yy < y + h && yy < H; yy++) {
    if (yy < 0) continue;
    for (let xx = x; xx < x + w && xx < W; xx++) {
      if (xx < 0) continue;
      const i = (yy * W + xx) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }
}

function drawChar(pixels, ch, x, y, scale, r, g, b) {
  const glyph = FONT[ch] || FONT['-'];
  if (!glyph.length) return 5 * scale;
  for (let row = 0; row < 7; row++) {
    const line = glyph[row] || '00000';
    for (let col = 0; col < 5; col++) {
      if (line[col] === '1') {
        rect(pixels, x + col * scale, y + row * scale, scale, scale, r, g, b);
      }
    }
  }
  return 6 * scale;
}

function drawText(pixels, text, x, y, scale, r, g, b) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    cx += drawChar(pixels, ch, cx, y, scale, r, g, b);
  }
  return cx;
}

function textWidth(text, scale) {
  return text.length * 6 * scale;
}

const files = {
  home: { bg: [18, 21, 28], accent: [196, 92, 38], label: 'TALENT CALCULATOR', sub: 'ALL 9 CLASSES' },
  warrior: { bg: [42, 22, 18], accent: [196, 80, 50], label: 'WARRIOR', sub: 'TALENT CALCULATOR' },
  paladin: { bg: [40, 34, 18], accent: [200, 160, 60], label: 'PALADIN', sub: 'TALENT CALCULATOR' },
  hunter: { bg: [22, 36, 18], accent: [90, 150, 60], label: 'HUNTER', sub: 'TALENT CALCULATOR' },
  rogue: { bg: [36, 36, 18], accent: [180, 170, 60], label: 'ROGUE', sub: 'TALENT CALCULATOR' },
  priest: { bg: [36, 36, 42], accent: [200, 200, 210], label: 'PRIEST', sub: 'TALENT CALCULATOR' },
  shaman: { bg: [16, 28, 48], accent: [60, 120, 200], label: 'SHAMAN', sub: 'TALENT CALCULATOR' },
  mage: { bg: [18, 28, 48], accent: [80, 140, 210], label: 'MAGE', sub: 'TALENT CALCULATOR' },
  warlock: { bg: [32, 18, 42], accent: [140, 70, 180], label: 'WARLOCK', sub: 'TALENT CALCULATOR' },
  druid: { bg: [40, 28, 16], accent: [180, 110, 40], label: 'DRUID', sub: 'TALENT CALCULATOR' },
};

for (const [name, cfg] of Object.entries(files)) {
  const pixels = Buffer.alloc(W * H * 3);
  fill(pixels, cfg.bg[0], cfg.bg[1], cfg.bg[2]);
  // top accent bar
  rect(pixels, 0, 0, W, 12, cfg.accent[0], cfg.accent[1], cfg.accent[2]);
  // left stripe
  rect(pixels, 0, 0, 16, H, cfg.accent[0], cfg.accent[1], cfg.accent[2]);
  // brand
  drawText(pixels, 'TALC', 80, 160, 10, 232, 234, 239);
  drawText(pixels, '.COM', 80 + textWidth('TALC', 10), 200, 4, 139, 147, 167);
  // label
  drawText(pixels, cfg.label, 80, 320, 6, cfg.accent[0], cfg.accent[1], cfg.accent[2]);
  drawText(pixels, cfg.sub, 80, 390, 3, 180, 186, 200);
  drawText(pixels, 'WOW FOREVER', 80, 520, 3, 100, 108, 124);

  writeFileSync(join(outDir, `${name}.png`), makePng(pixels));
}

console.log(`Wrote ${Object.keys(files).length} OG images to public/og/`);
