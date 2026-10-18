import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express, { type Express, type RequestHandler } from 'express';
import cors from 'cors';
import { createDatabase, type Db } from './db.js';
import { listCategories } from './categories.js';
import { getProduct, listProducts, parseProductId, parseProductListQuery } from './products.js';

/**
 * @param clientDir Directory of the built client to serve. Omitted in dev, where
 * Vite serves the client and this process is only the API.
 */
export function createApp(db: Db, clientDir?: string): Express {
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

  if (clientDir) {
    app.use(serveClient(clientDir));
  }

  return app;
}

/**
 * Serves the built client, then falls back to its index.html so client routes
 * survive a deep link or a reload.
 *
 * Requests that are not client routes are answered directly instead: an API path
 * (Express routes case-insensitively, so this is too) returns JSON, and a
 * missing asset returns 404. Both would otherwise get HTML with a 200, which
 * says nothing useful to a fetch expecting JSON or a browser expecting a script.
 */
function serveClient(clientDir: string): RequestHandler {
  const indexPath = resolve(clientDir, 'index.html');
  const hasExtension = /\.[^/]+$/;

  return (req, res, next) => {
    express.static(clientDir)(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }
      const isApiPath = /^\/api(\/|$)/i.test(req.path);
      if (isApiPath || hasExtension.test(req.path)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.sendFile(indexPath, (sendError) => (sendError ? next(sendError) : undefined));
    });
  };
}

function main(): void {
  const PORT = process.env.PORT || 3000;
  const databasePath = process.env.DATABASE_PATH
    ? resolve(process.env.DATABASE_PATH)
    : fileURLToPath(new URL('../../../data/app.db', import.meta.url));

  mkdirSync(dirname(databasePath), { recursive: true });

  // dist/index.js → ../../client/dist. Absent when only the API is deployed;
  // existsSync guards that rather than leaving a broken static handler.
  const clientDir = fileURLToPath(new URL('../../client/dist', import.meta.url));

  createApp(createDatabase(databasePath), existsSync(clientDir) ? clientDir : undefined).listen(
    PORT,
    () => {
      console.log(`Server running on http://localhost:${PORT}`);
    }
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
