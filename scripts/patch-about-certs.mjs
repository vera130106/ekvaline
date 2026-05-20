import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const payload = [
  {
    image: 'assets/certificate-declaration-eac-2025-preview.jpg',
    alt: 'Декларация о соответствии ЕАЭС',
    badge: 'Документ',
    title: 'Декларация о соответствии',
    description:
      'Подтверждение соответствия продукции «ЭкваЛайн» требованиям технических регламентов ЕАЭС.',
    pdf: 'assets/certificate-declaration-eac-2025.pdf',
  },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  `INSERT INTO site_settings (key, value) VALUES ('aboutCertificates', $1)
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
  [JSON.stringify(payload)]
);
await client.end();
console.log('aboutCertificates: одна карточка (декларация)');
