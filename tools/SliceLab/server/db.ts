import Database from "better-sqlite3";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  existsSync,
  renameSync,
} from "node:fs";
import { dirname, resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

// 素材文件存储目录：data/library/，缩略图目录：data/library/.thumbs/
export const STORAGE_DIR = resolve(DATA_DIR, "library");
export const THUMBS_DIR = resolve(STORAGE_DIR, ".thumbs");
mkdirSync(STORAGE_DIR, { recursive: true });
mkdirSync(THUMBS_DIR, { recursive: true });

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
  data BLOB,
  thumbnail BLOB,
  file_path TEXT,
  thumb_path TEXT,
  source_file TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_name ON images(name);
`);

// ============ Schema 迁移：为旧库添加新列 ============
try {
  const cols = db.pragma("table_info(images)") as { name: string; notnull: number }[];
  const hasFilePath = cols.some((c) => c.name === "file_path");
  const hasThumbPath = cols.some((c) => c.name === "thumb_path");
  if (!hasFilePath) db.exec("ALTER TABLE images ADD COLUMN file_path TEXT");
  if (!hasThumbPath) db.exec("ALTER TABLE images ADD COLUMN thumb_path TEXT");

  // 旧库的 data/thumbnail 列可能是 NOT NULL，导致迁移时无法置 NULL。
  // 通过重建表把这两列改为可空（SQLite 不支持 ALTER COLUMN）。
  const dataCol = cols.find((c) => c.name === "data");
  const thumbCol = cols.find((c) => c.name === "thumbnail");
  if ((dataCol && dataCol.notnull === 1) || (thumbCol && thumbCol.notnull === 1)) {
    console.log("[db] rebuilding images table to relax NOT NULL on data/thumbnail...");
    db.exec(`
CREATE TABLE images_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  pixel_count INTEGER DEFAULT 0,
  data BLOB,
  thumbnail BLOB,
  file_path TEXT,
  thumb_path TEXT,
  source_file TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
INSERT INTO images_new (id, name, category_id, width, height, pixel_count, data, thumbnail, file_path, thumb_path, source_file, metadata, created_at, updated_at)
SELECT id, name, category_id, width, height, pixel_count, data, thumbnail, file_path, thumb_path, source_file, metadata, created_at, updated_at FROM images;
DROP TABLE images;
ALTER TABLE images_new RENAME TO images;
CREATE INDEX IF NOT EXISTS idx_images_category ON images(category_id);
CREATE INDEX IF NOT EXISTS idx_images_name ON images(name);
`);
    console.log("[db] images table rebuilt.");
  }
} catch (e) {
  console.error("[db] schema migration failed:", e);
}

// ============ 文件存储辅助函数 ============
/** 将任意名称转为安全的文件名片段（去掉路径分隔符等危险字符） */
export function safeFileName(name: string): string {
  // 去掉扩展名（统一存 png），去掉路径分隔符和控制字符
  const base = name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").trim();
  return base || "image";
}

/** 生成素材原图的硬盘路径：data/library/<safeName>__<id>.png */
export function imageFilePath(id: number, name: string): string {
  return join(STORAGE_DIR, `${safeFileName(name)}__${id}.png`);
}

/** 生成素材缩略图的硬盘路径：data/library/.thumbs/<id>.png */
export function imageThumbPath(id: number): string {
  return join(THUMBS_DIR, `${id}.png`);
}

/** 启动时迁移：把已有 BLOB 写到硬盘，更新 file_path/thumb_path，清空 BLOB */
export function migrateBlobsToDisk(): { migrated: number } {
  const rows = db
    .prepare(`SELECT id, name, data, thumbnail FROM images WHERE file_path IS NULL AND data IS NOT NULL`)
    .all() as { id: number; name: string; data: Buffer; thumbnail: Buffer | null }[];
  let migrated = 0;
  for (const r of rows) {
    try {
      const fp = imageFilePath(r.id, r.name);
      writeFileSync(fp, r.data);
      let tp: string | null = null;
      if (r.thumbnail && r.thumbnail.length > 0) {
        tp = imageThumbPath(r.id);
        writeFileSync(tp, r.thumbnail);
      }
      db.prepare(
        `UPDATE images SET file_path = ?, thumb_path = ?, data = NULL, thumbnail = NULL WHERE id = ?`
      ).run(fp, tp, r.id);
      migrated++;
    } catch (e) {
      console.error(`[migrate] image ${r.id} failed:`, e);
    }
  }
  if (migrated > 0) {
    console.log(`[db] migrated ${migrated} BLOB(s) to disk storage.`);
    // 回收 BLOB 清空后遗留的空闲页，并截断 WAL
    try {
      db.pragma("wal_checkpoint(TRUNCATE)");
      db.exec("VACUUM");
      console.log("[db] VACUUM completed to reclaim disk space.");
    } catch (e) {
      console.error("[db] VACUUM failed:", e);
    }
  }
  return { migrated };
}

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
  data: Buffer | null;
  thumbnail: Buffer | null;
  file_path: string | null;
  thumb_path: string | null;
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

export function listImagesByIds(ids: number[]): ImageMeta[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, name, category_id, width, height, pixel_count, source_file, metadata, created_at, updated_at
       FROM images WHERE id IN (${placeholders})`
    )
    .all(...ids) as any[];
  return rows.map((r) => ({
    ...r,
    metadata: r.metadata ? JSON.parse(r.metadata) : null,
  }));
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

/**
 * 读取图片 PNG bytes：优先从硬盘 file_path 读取，回退读 BLOB（兼容未迁移的数据）
 */
export function getImageData(id: number): ImageRow | undefined {
  return db.prepare(`SELECT * FROM images WHERE id = ?`).get(id) as
    | ImageRow
    | undefined;
}

/** 读取图片 PNG bytes（从硬盘或 BLOB） */
export function readImagePng(id: number): Buffer | null {
  const row = getImageData(id);
  if (!row) return null;
  if (row.file_path && existsSync(row.file_path)) {
    return readFileSync(row.file_path);
  }
  return row.data ?? null;
}

/** 读取缩略图 PNG bytes */
export function readImageThumb(id: number): Buffer | null {
  const row = getImageData(id);
  if (!row) return null;
  if (row.thumb_path && existsSync(row.thumb_path)) {
    return readFileSync(row.thumb_path);
  }
  if (row.thumbnail && row.thumbnail.length > 0) return row.thumbnail;
  // 回退到原图
  return readImagePng(id);
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
  // 先插入得到 id，再写盘，再更新路径
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
  const id = info.lastInsertRowid as number;
  // 写入硬盘
  const fp = imageFilePath(id, input.name);
  writeFileSync(fp, input.data);
  let tp: string | null = null;
  if (input.thumbnail && input.thumbnail.length > 0) {
    tp = imageThumbPath(id);
    writeFileSync(tp, input.thumbnail);
  }
  // 更新 file_path/thumb_path，并清空 BLOB
  db.prepare(
    `UPDATE images SET file_path = ?, thumb_path = ?, data = NULL, thumbnail = NULL WHERE id = ?`
  ).run(fp, tp, id);
  return id;
}

export function createImagesBatch(inputs: CreateImageInput[]): number[] {
  const insertStmt = db.prepare(
    `INSERT INTO images (name, category_id, width, height, pixel_count, data, thumbnail, source_file, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateStmt = db.prepare(
    `UPDATE images SET file_path = ?, thumb_path = ?, data = NULL, thumbnail = NULL WHERE id = ?`
  );
  const ids: number[] = [];
  const tx = db.transaction((items: CreateImageInput[]) => {
    for (const input of items) {
      const info = insertStmt.run(
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
      const id = info.lastInsertRowid as number;
      ids.push(id);
    }
  });
  tx(inputs);
  // 事务提交后写盘（避免事务过大）
  for (let i = 0; i < inputs.length; i++) {
    const id = ids[i];
    const input = inputs[i];
    const fp = imageFilePath(id, input.name);
    writeFileSync(fp, input.data);
    let tp: string | null = null;
    if (input.thumbnail && input.thumbnail.length > 0) {
      tp = imageThumbPath(id);
      writeFileSync(tp, input.thumbnail);
    }
    updateStmt.run(fp, tp, id);
  }
  return ids;
}

export function renameImage(id: number, name: string): void {
  // 同步重命名硬盘文件
  const row = getImageData(id);
  if (row && row.file_path && existsSync(row.file_path)) {
    const newFp = imageFilePath(id, name);
    if (newFp !== row.file_path) {
      try {
        renameSync(row.file_path, newFp);
      } catch (e) {
        console.error(`[rename] image ${id} file rename failed:`, e);
      }
      db.prepare(
        `UPDATE images SET name = ?, file_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(name, newFp, id);
      return;
    }
  }
  db.prepare(
    `UPDATE images SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(name, id);
}

/**
 * 批量改名：按 ids 顺序依次命名为 <prefix><index>（index 从 1 开始）
 */
export function batchRenameImages(ids: number[], prefix: string): void {
  const stmt = db.prepare(
    `UPDATE images SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  );
  const tx = db.transaction(() => {
    ids.forEach((id, idx) => {
      const newName = `${prefix}${idx + 1}`;
      // 同步重命名硬盘文件
      const row = getImageData(id);
      if (row && row.file_path && existsSync(row.file_path)) {
        const newFp = imageFilePath(id, newName);
        if (newFp !== row.file_path) {
          try {
            renameSync(row.file_path, newFp);
            stmt.run(newName, id);
            db.prepare(
              `UPDATE images SET file_path = ? WHERE id = ?`
            ).run(newFp, id);
            return;
          } catch (e) {
            console.error(`[batch-rename] image ${id} file rename failed:`, e);
          }
        }
      }
      stmt.run(newName, id);
    });
  });
  tx();
}

/** 替换图片数据（PNG bytes）、尺寸、缩略图 */
export function updateImageData(
  id: number,
  input: { data: Buffer; width: number; height: number; thumbnail?: Buffer | null }
): void {
  // 写入硬盘
  const row = getImageData(id);
  const fp = row?.file_path && existsSync(row.file_path) ? row.file_path : imageFilePath(id, row?.name ?? `image_${id}`);
  writeFileSync(fp, input.data);
  let tp: string | null = null;
  if (input.thumbnail && input.thumbnail.length > 0) {
    tp = imageThumbPath(id);
    writeFileSync(tp, input.thumbnail);
  }
  db.prepare(
    `UPDATE images SET data = NULL, thumbnail = NULL, file_path = ?, thumb_path = ?, width = ?, height = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(fp, tp, input.width, input.height, id);
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

function deleteImageFiles(id: number): void {
  const row = getImageData(id);
  if (!row) return;
  if (row.file_path && existsSync(row.file_path)) {
    try { unlinkSync(row.file_path); } catch { /* ignore */ }
  }
  if (row.thumb_path && existsSync(row.thumb_path)) {
    try { unlinkSync(row.thumb_path); } catch { /* ignore */ }
  }
}

export function deleteImage(id: number): void {
  deleteImageFiles(id);
  db.prepare(`DELETE FROM images WHERE id = ?`).run(id);
}

export function batchDeleteImages(ids: number[]): void {
  const stmt = db.prepare(`DELETE FROM images WHERE id = ?`);
  const tx = db.transaction(() => {
    for (const id of ids) {
      deleteImageFiles(id);
      stmt.run(id);
    }
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
