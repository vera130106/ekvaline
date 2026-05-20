/**
 * Однократная генерация JPG-превью из PDF (страница 1).
 * node scripts/render-cert-preview.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pdfPath = path.join(root, 'assets', 'certificate-declaration-eac-2025.pdf');
const outPath = path.join(root, 'assets', 'certificate-declaration-eac-2025-preview.jpg');

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, standardFontDataUrl: undefined }).promise;
const page = await doc.getPage(1);
const scale = 2;
const viewport = page.getViewport({ scale });
const canvas = createCanvas(viewport.width, viewport.height);
const ctx = canvas.getContext('2d');
await page.render({ canvasContext: ctx, viewport }).promise;
const buf = canvas.toBuffer('image/jpeg', { quality: 0.88 });
fs.writeFileSync(outPath, buf);
console.log('Wrote', outPath, buf.length, 'bytes');
