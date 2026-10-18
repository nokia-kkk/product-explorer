import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { z } from 'zod';
import { importProducts, categorySchema, productSchema } from '../src/import.js';
import { createDatabase } from '../src/db.js';
import type { ImportPayload, ImportSummary } from '../src/import.js';

const CACHE_FILENAME = {
  products: 'products.json',
  categories: 'categories.json',
} as const;

export const PRODUCTS_URL = 'https://dummyjson.com/products?limit=0';
export const CATEGORIES_URL = 'https://dummyjson.com/products/categories';

const productsResponseSchema = z
  .object({
    products: z.array(productSchema).min(1),
    total: z.number().min(1),
  })
  .passthrough();

export interface RunImportOptions {
  cacheDir: string;
  dbPath: string;
  /** Force a network fetch even when the cache exists. */
  refresh?: boolean;
  fetchJson?: (url: string) => Promise<unknown>;
  log?: (message: string) => void;
}

function defaultFetchJson(url: string): Promise<unknown> {
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`GET ${url} failed with HTTP ${response.status}`);
    }
    return response.json();
  });
}

function toPayload(productsResponseJson: unknown, categoriesJson: unknown): ImportPayload {
  const { products } = productsResponseSchema.parse(productsResponseJson);
  return {
    products,
    categories: categorySchema.array().min(1).parse(categoriesJson),
  };
}

function loadPayload(options: {
  cacheDir: string;
  refresh?: boolean;
  fetchJson: (url: string) => Promise<unknown>;
}): Promise<ImportPayload> {
  const { cacheDir, refresh = false, fetchJson } = options;
  const productsPath = resolve(cacheDir, CACHE_FILENAME.products);
  const categoriesPath = resolve(cacheDir, CACHE_FILENAME.categories);

  function cacheHit(): ImportPayload | undefined {
    if (refresh || !existsSync(productsPath) || !existsSync(categoriesPath)) {
      return undefined;
    }
    return toPayload(
      JSON.parse(readFileSync(productsPath, 'utf8')),
      JSON.parse(readFileSync(categoriesPath, 'utf8'))
    );
  }

  return Promise.resolve(cacheHit()).then((payload) => {
    if (payload) {
      return payload;
    }
    return Promise.all([fetchJson(PRODUCTS_URL), fetchJson(CATEGORIES_URL)]).then(
      ([productsJson, categoriesJson]) => {
        const parsed = toPayload(productsJson, categoriesJson);
        mkdirSync(cacheDir, { recursive: true });
        writeFileSync(productsPath, JSON.stringify(productsJson));
        writeFileSync(categoriesPath, JSON.stringify(categoriesJson));
        return parsed;
      }
    );
  });
}

export async function runImport(options: RunImportOptions): Promise<ImportSummary> {
  const started = performance.now();
  const log = options.log ?? console.log;
  const fetchJson = options.fetchJson ?? defaultFetchJson;

  const payload = await loadPayload({
    cacheDir: options.cacheDir,
    refresh: options.refresh,
    fetchJson,
  });

  mkdirSync(dirname(options.dbPath), { recursive: true });
  const db = createDatabase(options.dbPath);
  let summary: ImportSummary;
  try {
    summary = importProducts(db, payload);
  } finally {
    db.close();
  }

  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  log(`Imported ${summary.categories} categories, ${summary.products} products in ${seconds}s`);

  return summary;
}

export function main(argv: string[]): void {
  runImport({
    cacheDir: fileURLToPath(new URL('../../../data/dummyjson-cache', import.meta.url)),
    dbPath: process.env.DATABASE_PATH
      ? resolve(process.env.DATABASE_PATH)
      : fileURLToPath(new URL('../../../data/app.db', import.meta.url)),
    refresh: argv.includes('--refresh'),
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv);
}
