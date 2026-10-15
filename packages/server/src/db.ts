import Database from 'better-sqlite3';

export type Db = Database.Database;

interface Migration {
  version: number;
  up: (db: Db) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          slug TEXT NOT NULL UNIQUE
        );

        CREATE TABLE products (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          discount_percentage REAL DEFAULT 0,
          rating REAL DEFAULT 0,
          stock INTEGER DEFAULT 0,
          brand TEXT,
          category_id INTEGER NOT NULL REFERENCES categories(id),
          thumbnail TEXT,
          images_json TEXT
        );

        CREATE INDEX idx_products_category ON products(category_id);
        CREATE INDEX idx_products_title ON products(title);
      `);
    },
  },
];

export function runMigrations(db: Db): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;

    db.transaction(() => {
      migration.up(db);
      db.pragma(`user_version = ${migration.version}`);
    })();
  }
}

export function createDatabase(path: string): Db {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  return db;
}
