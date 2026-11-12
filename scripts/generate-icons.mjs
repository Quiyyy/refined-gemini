#!/usr/bin/env node
/**
 * Zero-dependency anti-aliased PNG icon generator for Refined Gemini.
 * Renders crisp 16x16, 32x32, 48x48, and 128x128 RGBA PNG icons matching icons/icon.svg.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.resolve(__dirname, '../icons');

// Precompute CRC32 table for PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodeRGBA(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// Signed distance to a rounded box centered at (0.5, 0.5)
function sdRoundedBox(nx, ny, halfSize, radius) {
  const qx = Math.abs(nx - 0.5) - (halfSize - radius);
  const qy = Math.abs(ny - 0.5) - (halfSize - radius);
  const outDist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inDist = Math.min(Math.max(qx, qy), 0);
  return outDist + inDist - radius;
}

// Inside test for a crisp 4-point Gemini astroid star centered at (0.5, 0.5)
function inSparkle(nx, ny, starRadius) {
  const dx = Math.abs(nx - 0.5) / starRadius;
  const dy = Math.abs(ny - 0.5) / starRadius;
  if (dx > 1 || dy > 1) return false;
  // Superellipse p = 0.58 gives the signature concave 4-point sparkle curve
  return Math.pow(dx, 0.58) + Math.pow(dy, 0.58) <= 1.0;
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 4; // 4x4 supersampling for smooth anti-aliased edges

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgHits = 0;
      let starHits = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const nx = (x + (sx + 0.5) / samples) / size;
          const ny = (y + (sy + 0.5) / samples) / size;

          if (sdRoundedBox(nx, ny, 0.4375, 0.21875) <= 0) {
            bgHits++;
            if (inSparkle(nx, ny, 0.305)) {
              starHits++;
            }
          }
        }
      }

      const total = samples * samples;
      const idx = (y * size + x) * 4;

      if (bgHits === 0) {
        rgba[idx] = 0;
        rgba[idx + 1] = 0;
        rgba[idx + 2] = 0;
        rgba[idx + 3] = 0;
      } else {
        const starRatio = starHits / bgHits;
        // Blend between ChatGPT Accent Blue #0285FF (2, 133, 255) and #FFFFFF (255, 255, 255)
        const r = Math.round(2 + (255 - 2) * starRatio);
        const g = Math.round(133 + (255 - 133) * starRatio);
        const b = 255;
        const alpha = Math.round((bgHits / total) * 255);
        rgba[idx] = r;
        rgba[idx + 1] = g;
        rgba[idx + 2] = b;
        rgba[idx + 3] = alpha;
      }
    }
  }

  return encodeRGBA(size, size, rgba);
}

fs.mkdirSync(ICONS_DIR, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const outPath = path.join(ICONS_DIR, `icon${size}.png`);
  fs.writeFileSync(outPath, renderIcon(size));
  console.log(`Generated ${outPath}`);
}

const ASSETS_DIR = path.resolve(__dirname, '../docs/assets');
fs.mkdirSync(ASSETS_DIR, { recursive: true });
const storeLogoPath = path.join(ASSETS_DIR, 'store-logo-300.png');
fs.writeFileSync(storeLogoPath, renderIcon(300));
console.log(`Generated ${storeLogoPath}`);
