import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = resolve(DATA_DIR, "slicelab.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ============ Schema ============
db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  pixel_count INTEGER DEFAULT 0,
  data BLOB NOT NULL,
  thumbnail BLOB,
  source_file TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_name ON images(name);
`);

// ============ Types ============
export interface CategoryRow {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
}

export interface ImageRow {
  id: number;
  name: string;
  category_id: number | null;
  width: number;
  height: number;
  pixel_count: number;
  data: Buffer;
  thumbnail: Buffer | null;
  source_file: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageMeta {
  id: number;
  name: string;
  category_id: number | null;
  width: number;
  height: number;
  pixel_count: number;
  source_file: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// ============ Categories ============
export function listCategories(): CategoryRow[] {
  return db
    .prepare(`SELECT * FROM categories ORDER BY sort_order ASC, id ASC`)
    .all() as CategoryRow[];
}

export function createCategory(name: string, parentId: number | null): CategoryRow {
  const stmt = db.prepare(
    `INSERT INTO categories (name, parent_id) VALUES (?, ?)`
  );
  const info = stmt.run(name, parentId);
  return getCategory(info.lastInsertRowid as number)!;
}

export function getCategory(id: number): CategoryRow | undefined {
  return db
    .prepare(`SELECT * FROM categories WHERE id = ?`)
    .get(id) as CategoryRow | undefined;
}

export function renameCategory(id: number, name: string): void {
  db.prepare(`UPDATE categories SET name = ? WHERE id = ?`).run(name, id);
}

export function moveCategory(id: number, parentId: number | null): void {
  // 防止把分类移动到自己或其后代下面
  if (parentId !== null) {
    if (parentId === id) throw new Error("不能将分类移动到自身下");
    let cur: number | null = parentId;
    while (cur !== null) {
      const row = getCategory(cur);
      if (!row) break;
      if (row.parent_id === id) throw new Error("不能将分类移动到其子分类下");
      cur = row.parent_id;
    }
  }
  db.prepare(`UPDATE categories SET parent_id = ? WHERE id = ?`).run(parentId, id);
}

export function deleteCategory(id: number): void {
  // 子分类被 CASCADE 删除，图片的 category_id 被 SET NULL
  db.prepare(`DELETE FROM categories WHERE id = ?`).run(id);
}

// ============ Images ============
export function listImages(opts: {
  categoryId?: number | null;
  search?: string;
  limit?: number;
  offset?: number;
}): { items: ImageMeta[]; total: number } {
  const where: string[] = [];
  const params: any[] = [];
  if (opts.categoryId !== undefined) {
    where.push(`category_id ${opts.categoryId === null ? "IS NULL" : "= ?"}`);
    if (opts.categoryId !== null) params.push(opts.categoryId);
  }
  if (opts.search) {
    where.push(`name LIKE ?`);
    params.push(`%${opts.search}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;

  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM images ${whereSql}`).get(...params) as {
      c: number;
    }
  ).c;

  const rows = db
    .prepare(
      `SELECT id, name, category_id, width, height, pixel_count, source_file, metadata, created_at, updated_at
       FROM images ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as any[];

  const items: ImageMeta[] = rows.map((r) => ({
    ...r,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
  }));
  return { items, total };
}

export function getImageMeta(id: number): ImageMeta | undefined {
  const row = db
    .prepare(
      `SELECT id, name, category_id, width, height, pixel_count, source_file, metadata, created_at, updated_at
       FROM images WHERE id = ?`
    )
    .get(id) as any;
  if (!row) return undefined;
  return { ...row, metadata: row.metadata ? JSON.parse(row.metadata) : null };
}

export function getImageData(id: number): ImageRow | undefined {
  return db.prepare(`SELECT * FROM images WHERE id = ?`).get(id) as
    | ImageRow
    | undefined;
}

export interface CreateImageInput {
  name: string;
  category_id?: number | null;
  width: number;
  height: number;
  pixel_count?: number;
  data: Buffer; // PNG bytes
  thumbnail?: Buffer | null;
  source_file?: string | null;
  metadata?: any;
}

export function createImage(input: CreateImageInput): number {
  const stmt = db.prepare(
    `INSERT INTO images (name, category_id, width, height, pixel_count, data, thumbnail, source_file, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    input.name,
    input.category_id ?? null,
    input.width,
    input.height,
    input.pixel_count ?? 0,
    input.data,
    input.thumbnail ?? null,
    input.source_file ?? null,
    input.metadata ? JSON.stringify(input.metadata) : null
  );
  return info.lastInsertRowid as number;
}

export function createImagesBatch(inputs: CreateImageInput[]): number[] {
  const stmt = db.prepare(
    `INSERT INTO images (name, category_id, width, height, pixel_count, data, thumbnail, source_file, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const ids: number[] = [];
  const tx = db.transaction((items: CreateImageInput[]) => {
    for (const input of items) {
      const info = stmt.run(
        input.name,
        input.category_id ?? null,
        input.width,
        input.height,
        input.pixel_count ?? 0,
        input.data,
        input.thumbnail ?? null,
        input.source_file ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null
      );
      ids.push(info.lastInsertRowid as number);
    }
  });
  tx(inputs);
  return ids;
}

export function renameImage(id: number, name: string): void {
  db.prepare(
    `UPDATE images SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(name, id);
}

/** 替换图片数据（PNG bytes）、尺寸、缩略图 */
export function updateImageData(
  id: number,
  input: { data: Buffer; width: number; height: number; thumbnail?: Buffer | null }
): void {
  db.prepare(
    `UPDATE images SET data = ?, width = ?, height = ?, thumbnail = COALESCE(?, thumbnail), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(input.data, input.width, input.height, input.thumbnail ?? null, id);
}

export function moveImage(id: number, categoryId: number | null): void {
  db.prepare(
    `UPDATE images SET category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(categoryId, id);
}

export function batchMoveImages(ids: number[], categoryId: number | null): void {
  const stmt = db.prepare(
    `UPDATE images SET category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  const tx = db.transaction(() => {
    for (const id of ids) stmt.run(categoryId, id);
  });
  tx();
}

export function deleteImage(id: number): void {
  db.prepare(`DELETE FROM images WHERE id = ?`).run(id);
}

export function batchDeleteImages(ids: number[]): void {
  const stmt = db.prepare(`DELETE FROM images WHERE id = ?`);
  const tx = db.transaction(() => {
    for (const id of ids) stmt.run(id);
  });
  tx();
}

export function getImagesByIds(ids: number[]): ImageRow[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  return db
    .prepare(`SELECT * FROM images WHERE id IN (${placeholders})`)
    .all(...ids) as ImageRow[];
}
