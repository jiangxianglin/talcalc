/**
 * 1200×630 build OG cards for Cloudflare Workers (no node:zlib / canvas).
 * Bitmap font + CompressionStream('deflate') for PNG IDAT.
 */

const W = 1200;
const H = 630;

/** 5×7 uppercase glyphs used on OG cards */
const FONT: Record<string, string[]> = {
  ' ': [],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
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

export type BuildOgInput = {
  className: string;
  accentHex: string;
  distLabel: string;
  used: number;
  totalPoints: number;
  treeLabels: string[];
  highlightNames: string[];
};

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length >= 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  return [201, 169, 110];
}

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function u32(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
}

function concat(parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBuf = new TextEncoder().encode(type);
  const crc = u32(crc32(concat([typeBuf, data])));
  return concat([u32(data.length), typeBuf, data, crc]);
}

async function deflateZlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function encodePngRgb(pixels: Uint8Array): Promise<Uint8Array> {
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const rowStart = y * (1 + W * 3);
    raw[rowStart] = 0;
    raw.set(pixels.subarray(y * W * 3, (y + 1) * W * 3), rowStart + 1);
  }
  const ihdr = new Uint8Array(13);
  ihdr.set(u32(W), 0);
  ihdr.set(u32(H), 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const compressed = await deflateZlib(raw);
  return concat([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

function fill(pixels: Uint8Array, r: number, g: number, b: number) {
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }
}

function rect(
  pixels: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
) {
  const x0 = Math.max(0, x | 0);
  const y0 = Math.max(0, y | 0);
  const x1 = Math.min(W, (x + w) | 0);
  const y1 = Math.min(H, (y + h) | 0);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
    }
  }
}

function softRect(
  pixels: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  alpha: number,
) {
  const x0 = Math.max(0, x | 0);
  const y0 = Math.max(0, y | 0);
  const x1 = Math.min(W, (x + w) | 0);
  const y1 = Math.min(H, (y + h) | 0);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      pixels[i] = Math.round(pixels[i]! * (1 - alpha) + r * alpha);
      pixels[i + 1] = Math.round(pixels[i + 1]! * (1 - alpha) + g * alpha);
      pixels[i + 2] = Math.round(pixels[i + 2]! * (1 - alpha) + b * alpha);
    }
  }
}

function drawChar(
  pixels: Uint8Array,
  ch: string,
  x: number,
  y: number,
  scale: number,
  r: number,
  g: number,
  b: number,
): number {
  const glyph = FONT[ch] ?? FONT['-']!;
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

function sanitize(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9\s\-\/\.:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function drawText(
  pixels: Uint8Array,
  text: string,
  x: number,
  y: number,
  scale: number,
  r: number,
  g: number,
  b: number,
  maxWidth = W - x - 40,
): number {
  let cx = x;
  for (const ch of sanitize(text)) {
    const advance = (FONT[ch]?.length ? 6 : 5) * scale;
    if (cx + advance - x > maxWidth) break;
    cx += drawChar(pixels, ch, cx, y, scale, r, g, b);
  }
  return cx;
}

function textWidth(text: string, scale: number): number {
  let w = 0;
  for (const ch of sanitize(text)) {
    w += (FONT[ch]?.length ? 6 : 5) * scale;
  }
  return w;
}

export async function renderBuildOgPng(input: BuildOgInput): Promise<Uint8Array> {
  const accent = parseHex(input.accentHex || '#c9a96e');
  const base: [number, number, number] = [
    Math.min(22, 8 + Math.round(accent[0] * 0.07)),
    Math.min(22, 8 + Math.round(accent[1] * 0.07)),
    Math.min(30, 12 + Math.round(accent[2] * 0.09)),
  ];

  const pixels = new Uint8Array(W * H * 3);
  fill(pixels, base[0], base[1], base[2]);

  softRect(pixels, -60, -100, 560, 380, accent[0], accent[1], accent[2], 0.2);
  softRect(pixels, 860, -20, 480, 260, 61, 133, 198, 0.1);

  rect(pixels, 0, 0, W, 10, accent[0], accent[1], accent[2]);
  rect(pixels, 0, 0, 14, H, accent[0], accent[1], accent[2]);

  // Right-side talent-grid motif
  const gridX = 760;
  const gridY = 100;
  const cell = 48;
  const gap = 12;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const x = gridX + col * (cell + gap);
      const y = gridY + row * (cell + gap);
      const filled = (row + col) % 3 !== 2;
      softRect(pixels, x, y, cell, cell, accent[0], accent[1], accent[2], filled ? 0.3 : 0.1);
    }
  }

  drawText(pixels, 'TALC', 72, 56, 5, accent[0], accent[1], accent[2]);
  drawText(pixels, '.COM', 72 + textWidth('TALC', 5), 72, 3, 93, 104, 121);

  drawText(pixels, input.className, 72, 150, 9, 244, 246, 250, 640);
  drawText(pixels, 'TALENT BUILD', 72, 230, 4, 184, 192, 208);

  drawText(pixels, input.distLabel || '0/0/0', 72, 300, 7, accent[0], accent[1], accent[2]);
  drawText(
    pixels,
    `${input.used} OF ${input.totalPoints} POINTS`,
    72,
    370,
    3,
    184,
    192,
    208,
  );

  let chipX = 72;
  const chipY = 420;
  for (const label of input.treeLabels.slice(0, 3)) {
    const text = sanitize(label);
    const tw = textWidth(text, 2) + 28;
    softRect(pixels, chipX, chipY, tw, 36, accent[0], accent[1], accent[2], 0.18);
    rect(pixels, chipX, chipY, tw, 2, accent[0], accent[1], accent[2]);
    drawText(pixels, text, chipX + 14, chipY + 10, 2, accent[0], accent[1], accent[2]);
    chipX += tw + 12;
  }

  let lineY = 480;
  for (const name of input.highlightNames.slice(0, 3)) {
    drawText(pixels, name, 72, lineY, 2, 139, 147, 167, 560);
    lineY += 28;
  }

  // Glyph font is uppercase-only; brand on-site is "Talc" → TALC.COM (not TALCALC).
  drawText(pixels, 'TALC.COM', 72, 580, 3, accent[0], accent[1], accent[2]);
  drawText(pixels, 'WOW FOREVER', 720, 580, 3, 93, 104, 121);

  return encodePngRgb(pixels);
}
