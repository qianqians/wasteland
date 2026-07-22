// UI 系统后端：方案（ui_schemes）+ 模板（component_templates）
// 复用主库 slicelab.db 中的 images 表作为素材源（assetId = images.id）
// 路由：/api/ui/schemes, /api/ui/templates
import type { Express } from "express";
import { db } from "./db.js";

// ============ Schema ============
db.exec(`
CREATE TABLE IF NOT EXISTS ui_schemes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  canvas_width INTEGER NOT NULL DEFAULT 1920,
  canvas_height INTEGER NOT NULL DEFAULT 1080,
  root_node TEXT NOT NULL,
  extra_root_nodes TEXT DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS component_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  thumbnail TEXT,
  node_data TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

// 兼容旧库迁移：补充 extra_root_nodes 列
try {
  const cols = db.pragma("table_info(ui_schemes)") as { name: string }[];
  if (cols.length > 0 && !cols.some((c) => c.name === "extra_root_nodes")) {
    db.exec("ALTER TABLE ui_schemes ADD COLUMN extra_root_nodes TEXT DEFAULT '[]'");
  }
} catch {
  /* ignore */
}

// ============ Types ============
export interface UiScheme {
  id: number;
  name: string;
  description: string;
  canvas_width: number;
  canvas_height: number;
  root_node: any;
  extra_root_nodes: any[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface UiSchemeMeta {
  id: number;
  name: string;
  description: string;
  canvas_width: number;
  canvas_height: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ComponentTemplate {
  id: number;
  name: string;
  thumbnail: string | null;
  node_data: any;
  created_at: string;
  updated_at: string;
}

// ============ Helpers ============
function rowToScheme(row: any): UiScheme {
  return {
    ...row,
    root_node: typeof row.root_node === "string" ? JSON.parse(row.root_node) : row.root_node,
    extra_root_nodes:
      typeof row.extra_root_nodes === "string"
        ? JSON.parse(row.extra_root_nodes || "[]")
        : row.extra_root_nodes ?? [],
  };
}

function rowToTemplate(row: any): ComponentTemplate {
  return {
    ...row,
    node_data: typeof row.node_data === "string" ? JSON.parse(row.node_data) : row.node_data,
  };
}

// ============ Mount ============
export function mountUiSystem(app: Express) {
  // ====== 方案列表（不含 root_node） ======
  app.get("/api/ui/schemes", (req, res) => {
    try {
      const rows = db
        .prepare(
          `SELECT id, name, description, canvas_width, canvas_height, version, created_at, updated_at
           FROM ui_schemes ORDER BY updated_at DESC`
        )
        .all() as UiSchemeMeta[];
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 方案详情 ======
  app.get("/api/ui/schemes/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const row = db.prepare("SELECT * FROM ui_schemes WHERE id = ?").get(id) as any;
      if (!row) return res.status(404).json({ error: "方案不存在" });
      res.json(rowToScheme(row));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 创建方案 ======
  app.post("/api/ui/schemes", (req, res) => {
    try {
      const {
        name,
        description = "",
        canvasWidth = 1920,
        canvasHeight = 1080,
        rootNode = {},
        extraRootNodes = [],
      } = req.body as {
        name: string;
        description?: string;
        canvasWidth?: number;
        canvasHeight?: number;
        rootNode?: any;
        extraRootNodes?: any[];
      };
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "方案名称不能为空" });
      }
      const rootNodeStr = JSON.stringify(rootNode ?? {});
      const extraStr = JSON.stringify(extraRootNodes ?? []);
      const info = db
        .prepare(
          `INSERT INTO ui_schemes (name, description, canvas_width, canvas_height, root_node, extra_root_nodes, version)
           VALUES (?, ?, ?, ?, ?, ?, 1)`
        )
        .run(name.trim(), description, Number(canvasWidth), Number(canvasHeight), rootNodeStr, extraStr);
      const row = db.prepare("SELECT * FROM ui_schemes WHERE id = ?").get(info.lastInsertRowid) as any;
      res.status(201).json(rowToScheme(row));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 更新方案（递增 version） ======
  app.put("/api/ui/schemes/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.prepare("SELECT * FROM ui_schemes WHERE id = ?").get(id) as any;
      if (!existing) return res.status(404).json({ error: "方案不存在" });
      const {
        name,
        description,
        canvasWidth,
        canvasHeight,
        rootNode,
        extraRootNodes,
      } = req.body as any;
      const updateName = name !== undefined ? name : existing.name;
      const updateDesc = description !== undefined ? description : existing.description;
      const updateW = canvasWidth !== undefined ? Number(canvasWidth) : existing.canvas_width;
      const updateH = canvasHeight !== undefined ? Number(canvasHeight) : existing.canvas_height;
      const updateRoot =
        rootNode !== undefined
          ? typeof rootNode === "object"
            ? JSON.stringify(rootNode)
            : String(rootNode)
          : existing.root_node;
      const updateExtra =
        extraRootNodes !== undefined
          ? JSON.stringify(extraRootNodes ?? [])
          : existing.extra_root_nodes || "[]";
      const newVersion = (existing.version || 0) + 1;
      db.prepare(
        `UPDATE ui_schemes
         SET name = ?, description = ?, canvas_width = ?, canvas_height = ?, root_node = ?, extra_root_nodes = ?, version = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(updateName, updateDesc, updateW, updateH, updateRoot, updateExtra, newVersion, id);
      const row = db.prepare("SELECT * FROM ui_schemes WHERE id = ?").get(id) as any;
      res.json(rowToScheme(row));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 自动保存（不递增 version） ======
  app.put("/api/ui/schemes/:id/autosave", (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.prepare("SELECT * FROM ui_schemes WHERE id = ?").get(id) as any;
      if (!existing) return res.status(404).json({ error: "方案不存在" });
      const {
        name,
        description,
        canvasWidth,
        canvasHeight,
        rootNode,
        extraRootNodes,
      } = req.body as any;
      const updateName = name !== undefined ? name : existing.name;
      const updateDesc = description !== undefined ? description : existing.description;
      const updateW = canvasWidth !== undefined ? Number(canvasWidth) : existing.canvas_width;
      const updateH = canvasHeight !== undefined ? Number(canvasHeight) : existing.canvas_height;
      const updateRoot =
        rootNode !== undefined
          ? typeof rootNode === "object"
            ? JSON.stringify(rootNode)
            : String(rootNode)
          : existing.root_node;
      const updateExtra =
        extraRootNodes !== undefined
          ? JSON.stringify(extraRootNodes ?? [])
          : existing.extra_root_nodes || "[]";
      db.prepare(
        `UPDATE ui_schemes
         SET name = ?, description = ?, canvas_width = ?, canvas_height = ?, root_node = ?, extra_root_nodes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(updateName, updateDesc, updateW, updateH, updateRoot, updateExtra, id);
      const row = db.prepare("SELECT * FROM ui_schemes WHERE id = ?").get(id) as any;
      res.json(rowToScheme(row));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 删除方案 ======
  app.delete("/api/ui/schemes/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      db.prepare("DELETE FROM ui_schemes WHERE id = ?").run(id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 模板列表 ======
  app.get("/api/ui/templates", (req, res) => {
    try {
      const rows = db
        .prepare("SELECT * FROM component_templates ORDER BY created_at DESC")
        .all() as any[];
      res.json(rows.map(rowToTemplate));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 创建模板 ======
  app.post("/api/ui/templates", (req, res) => {
    try {
      const { name, nodeData, thumbnail = "" } = req.body as {
        name: string;
        nodeData: any;
        thumbnail?: string;
      };
      if (!name || !name.trim()) return res.status(400).json({ error: "模板名称不能为空" });
      if (nodeData === undefined) return res.status(400).json({ error: "nodeData 不能为空" });
      const nodeDataStr =
        typeof nodeData === "object" ? JSON.stringify(nodeData) : String(nodeData);
      const info = db
        .prepare(
          "INSERT INTO component_templates (name, thumbnail, node_data) VALUES (?, ?, ?)"
        )
        .run(name.trim(), thumbnail || "", nodeDataStr);
      const row = db
        .prepare("SELECT * FROM component_templates WHERE id = ?")
        .get(info.lastInsertRowid) as any;
      res.status(201).json(rowToTemplate(row));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 更新模板 ======
  app.put("/api/ui/templates/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db
        .prepare("SELECT * FROM component_templates WHERE id = ?")
        .get(id) as any;
      if (!existing) return res.status(404).json({ error: "模板不存在" });
      const { name, nodeData, thumbnail } = req.body as any;
      const updateName = name !== undefined ? name : existing.name;
      const updateNode =
        nodeData !== undefined
          ? typeof nodeData === "object"
            ? JSON.stringify(nodeData)
            : String(nodeData)
          : existing.node_data;
      const updateThumb = thumbnail !== undefined ? thumbnail : existing.thumbnail;
      db.prepare(
        "UPDATE component_templates SET name = ?, thumbnail = ?, node_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(updateName, updateThumb, updateNode, id);
      const row = db.prepare("SELECT * FROM component_templates WHERE id = ?").get(id) as any;
      res.json(rowToTemplate(row));
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // ====== 删除模板 ======
  app.delete("/api/ui/templates/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      db.prepare("DELETE FROM component_templates WHERE id = ?").run(id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
}
