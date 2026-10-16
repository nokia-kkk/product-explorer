import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createDatabase } from './db';
import { listCategories } from './categories';
import { listProducts, parseProductListQuery } from './products';

const app = express();
const PORT = process.env.PORT || 3000;

const databasePath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : fileURLToPath(new URL('../../../data/app.db', import.meta.url));

mkdirSync(dirname(databasePath), { recursive: true });
const db = createDatabase(databasePath);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  db.prepare('SELECT 1').get();
  res.json({ status: 'ok' });
});

app.get('/api/categories', (_req, res) => {
  res.json(listCategories(db));
});

app.get('/api/products', (req, res) => {
  const parsed = parseProductListQuery(req.query);
  if (!parsed.ok) {
    res.status(400).json({ error: 'Invalid query parameters', details: parsed.errors });
    return;
  }
  res.json(listProducts(db, parsed.params));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
