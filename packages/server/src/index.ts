import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express, { type Express } from 'express';
import cors from 'cors';
import { createDatabase, type Db } from './db';
import { listCategories } from './categories';
import { getProduct, listProducts, parseProductId, parseProductListQuery } from './products';

export function createApp(db: Db): Express {
  const app = express();

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

  app.get('/api/products/:id', (req, res) => {
    const id = parseProductId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Invalid product id' });
      return;
    }
    const product = getProduct(db, id);
    if (product === null) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ data: product });
  });

  return app;
}

function main(): void {
  const PORT = process.env.PORT || 3000;
  const databasePath = process.env.DATABASE_PATH
    ? resolve(process.env.DATABASE_PATH)
    : fileURLToPath(new URL('../../../data/app.db', import.meta.url));

  mkdirSync(dirname(databasePath), { recursive: true });
  createApp(createDatabase(databasePath)).listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
