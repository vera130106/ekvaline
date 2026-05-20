import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'certificate-declaration-eac-2025-preview.jpg');
const w = 520;
const h = 680;
const canvas = createCanvas(w, h);
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#f8fafc';
ctx.fillRect(0, 0, w, h);
ctx.strokeStyle = '#cbd5e1';
ctx.lineWidth = 2;
ctx.strokeRect(24, 24, w - 48, h - 48);

ctx.fillStyle = '#1e3a5f';
ctx.font = 'bold 28px sans-serif';
ctx.fillText('Декларация', 48, 90);
ctx.font = '22px sans-serif';
ctx.fillStyle = '#475569';
ctx.fillText('о соответствии ЕАЭС', 48, 125);

ctx.fillStyle = '#94a3b8';
ctx.font = '16px sans-serif';
for (let i = 0; i < 12; i++) {
  ctx.fillRect(48, 160 + i * 36, w - 96, 14);
}

fs.writeFileSync(out, canvas.toBuffer('image/jpeg', { quality: 0.9 }));
console.log('ok', out);
