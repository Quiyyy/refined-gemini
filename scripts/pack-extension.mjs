#!/usr/bin/env node
/**
 * Zero-dependency Store Package Builder for Microsoft Edge Add-ons & Chrome Web Store.
 * Bundles strictly the runtime Manifest V3 extension files into:
 *   dist/refined-gemini-v<version>-extension.zip
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
const DIST_DIR = path.join(ROOT, 'dist');

const EXTENSION_FILES = [
  'manifest.json',
  'LICENSE',
  '_locales/en/messages.json',
  '_locales/zh_CN/messages.json',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'src/defaults.js',
  'src/content.css',
  'src/content.js',
  'src/sandbox.css',
  'src/sandbox.js',
  'src/popup/popup.html',
  'src/popup/popup.css',
  'src/popup/popup.js'
];

// Precompute CRC32 table for ZIP format
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

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const { relPath, data } of entries) {
    const nameBuf = Buffer.from(relPath.replace(/\\/g, '/'), 'utf8');
    const uncompressedSize = data.length;
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = compressed.length < uncompressedSize;
    const body = useDeflate ? compressed : data;
    const method = useDeflate ? 8 : 0;

    // Local file header (30 bytes + filename)
    const localHdr = Buffer.alloc(30);
    localHdr.writeUInt32LE(0x04034b50, 0); // signature
    localHdr.writeUInt16LE(20, 4);         // version needed (2.0)
    localHdr.writeUInt16LE(0x0800, 6);     // UTF-8 filename flag
    localHdr.writeUInt16LE(method, 8);     // compression method
    localHdr.writeUInt16LE(0, 10);         // mod time
    localHdr.writeUInt16LE(0x5421, 12);    // mod date
    localHdr.writeUInt32LE(crc, 14);
    localHdr.writeUInt32LE(body.length, 18);
    localHdr.writeUInt32LE(uncompressedSize, 22);
    localHdr.writeUInt16LE(nameBuf.length, 26);
    localHdr.writeUInt16LE(0, 28);         // extra len

    localParts.push(localHdr, nameBuf, body);

    // Central directory header (46 bytes + filename)
    const centralHdr = Buffer.alloc(46);
    centralHdr.writeUInt32LE(0x02014b50, 0); // signature
    centralHdr.writeUInt16LE(20, 4);         // version made by
    centralHdr.writeUInt16LE(20, 6);         // version needed
    centralHdr.writeUInt16LE(0x0800, 8);     // UTF-8 flag
    centralHdr.writeUInt16LE(method, 10);
    centralHdr.writeUInt16LE(0, 12);
    centralHdr.writeUInt16LE(0x5421, 14);
    centralHdr.writeUInt32LE(crc, 16);
    centralHdr.writeUInt32LE(body.length, 20);
    centralHdr.writeUInt32LE(uncompressedSize, 24);
    centralHdr.writeUInt16LE(nameBuf.length, 28);
    centralHdr.writeUInt16LE(0, 30);         // extra len
    centralHdr.writeUInt16LE(0, 32);         // comment len
    centralHdr.writeUInt16LE(0, 34);         // disk start
    centralHdr.writeUInt16LE(0, 36);         // internal attrs
    centralHdr.writeUInt32LE(0, 38);         // external attrs
    centralHdr.writeUInt32LE(offset, 42);    // relative offset

    centralParts.push(centralHdr, nameBuf);
    offset += localHdr.length + nameBuf.length + body.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

const entries = EXTENSION_FILES.map((relPath) => {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required extension file: ${relPath}`);
  }
  return { relPath, data: fs.readFileSync(fullPath) };
});

fs.mkdirSync(DIST_DIR, { recursive: true });
for (const existing of fs.readdirSync(DIST_DIR)) {
  if (existing.endsWith('.zip')) {
    fs.unlinkSync(path.join(DIST_DIR, existing));
  }
}
const zipName = `refined-gemini-v${manifest.version}-extension.zip`;
const outZip = path.join(DIST_DIR, zipName);
const zipBuffer = buildZip(entries);
fs.writeFileSync(outZip, zipBuffer);

// Also copy userscript to dist/ for convenient GitHub Release upload
fs.writeFileSync(
  path.join(DIST_DIR, 'refined-gemini.user.js'),
  fs.readFileSync(path.join(ROOT, 'userscript/refined-gemini.user.js'))
);

console.log(`Packed ${entries.length} files -> ${outZip} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
