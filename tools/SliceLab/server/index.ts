import express from "express";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import JSZip from "jszip";
import {
  listCategories,
  createCategory,
  renameCategory,
  moveCategory,
  deleteCategory,
  listImages,
  getImageMeta,
  getImageData,
  createImage,
  createImagesBatch,
  renameImage,
  updateImageData,
  moveImage,
  batchMoveImages,
  deleteImage,
  batchDeleteImages,
  getImagesByIds,
  type ImageRow,
  type CategoryRow,
} from "./db.js";
import { packAtlas, packAtlasAsZip, defaultPackOptions, type PackOptions } from "./atlas.js";

const app = express();
const PORT = 5181;

app.use(cors());
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// 缩略图生成（仅返回原 PNG bytes；如需更小，可在前端展示时压缩）
const upload = multer({ storage: multer.memoryStorage() });

// ============ 错误处理中间件 ============
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============ 分类 ============
app.get(
  "/api/categories",
  asyncHandler(async (_req, res) => {
    const rows = listCategories();
    res.json(rows);
  })
);

app.post(
  "/api/categories",
  asyncHandler(async (req, res) => {
    const { name, parent_id } = req.body as {
      name?: string;
      parent_id?: number | null;
    };
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "分类名称不能为空" });
    }
    const row = createCategory(name.trim(), parent_id ?? null);
    res.status(201).json(row);
  })
);

app.put(
  "/api/categories/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, parent_id } = req.body as {
      name?: string;
      parent_id?: number | null;
    };
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: "分类名称不能为空" });
      renameCategory(id, name.trim());
    }
    if (parent_id !== undefined) {
      try {
        moveCategory(id, parent_id === null ? null : Number(parent_id));
      } catch (e) {
        return res.status(400).json({ error: (e as Error).message });
      }
    }
    res.json({ ok: true });
  })
);

app.delete(
  "/api/categories/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    deleteCategory(id);
    res.json({ ok: true });
  })
);

// ============ 图片 ============
app.get(
  "/api/images",
  asyncHandler(async (req, res) => {
    const categoryIdRaw = req.query.category_id as string | undefined;
    let categoryId: number | null | undefined;
    if (categoryIdRaw === "null" || categoryIdRaw === "") categoryId = null;
    else if (categoryIdRaw !== undefined) categoryId = Number(categoryIdRaw);
    const search = (req.query.search as string | undefined) || undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const result = listImages({ categoryId, search, limit, offset });
    res.json(result);
  })
);

app.get(
  "/api/images/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const meta = getImageMeta(id);
    if (!meta) return res.status(404).json({ error: "图片不存在" });
    res.json(meta);
  })
);

app.get(
  "/api/images/:id/file",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = getImageData(id);
    if (!row) return res.status(404).json({ error: "图片不存在" });
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(row.name)}"`
    );
    res.send(Buffer.from(row.data));
  })
);

app.get(
  "/api/images/:id/thumbnail",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = getImageData(id);
    if (!row) return res.status(404).json({ error: "图片不存在" });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(row.thumbnail ?? row.data));
  })
);

// 单图上传（multipart file）
app.post(
  "/api/images/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "未上传文件" });
    const categoryId = req.body.category_id
      ? Number(req.body.category_id)
      : null;
    const name = req.body.name || req.file.originalname;
    // 解析 PNG 尺寸（PNG IHDR 在前 24 字节）
    const dims = parsePngSize(req.file.buffer);
    if (!dims) {
      return res.status(400).json({ error: "无效的 PNG 文件" });
    }
    const id = createImage({
      name,
      category_id: categoryId,
      width: dims.width,
      height: dims.height,
      data: req.file.buffer,
      source_file: req.file.originalname,
    });
    res.status(201).json({ id });
  })
);

// 批量导入：base64 数组（前端将 Blob 转 base64 后发送）
app.post(
  "/api/images/batch",
  asyncHandler(async (req, res) => {
    interface BatchItem {
      name: string;
      data_base64: string;
      width: number;
      height: number;
      pixel_count?: number;
      source_file?: string;
      metadata?: any;
    }
    const { items, category_id } = req.body as {
      items: BatchItem[];
      category_id?: number | null;
    };
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items 不能为空" });
    }
    const inputs = items.map((it) => {
      const buf = Buffer.from(it.data_base64, "base64");
      return {
        name: it.name,
        category_id: category_id ?? null,
        width: it.width,
        height: it.height,
        pixel_count: it.pixel_count ?? 0,
        data: buf,
        source_file: it.source_file ?? null,
        metadata: it.metadata ?? null,
      };
    });
    const ids = createImagesBatch(inputs);
    res.status(201).json({ ids });
  })
);

app.put(
  "/api/images/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { name, category_id } = req.body as {
      name?: string;
      category_id?: number | null;
    };
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: "名称不能为空" });
      renameImage(id, name.trim());
    }
    if (category_id !== undefined) {
      moveImage(id, category_id === null ? null : Number(category_id));
    }
    res.json({ ok: true });
  })
);

// 替换图片像素数据（编辑器保存）：接收 base64 PNG，更新 data + thumbnail + 尺寸
app.put(
  "/api/images/:id/data",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { data_base64 } = req.body as { data_base64?: string };
    if (!data_base64) {
      return res.status(400).json({ error: "data_base64 不能为空" });
    }
    const buf = Buffer.from(data_base64, "base64");
    const dims = parsePngSize(buf);
    if (!dims) {
      return res.status(400).json({ error: "无效的 PNG 数据" });
    }
    const thumbnail = await generateThumbnail(buf, 256);
    updateImageData(id, {
      data: buf,
      width: dims.width,
      height: dims.height,
      thumbnail,
    });
    res.json({ ok: true, width: dims.width, height: dims.height });
  })
);

app.post(
  "/api/images/batch-move",
  asyncHandler(async (req, res) => {
    const { ids, category_id } = req.body as {
      ids: number[];
      category_id: number | null;
    };
    if (!Array.isArray(ids)) return res.status(400).json({ error: "ids 必须为数组" });
    batchMoveImages(ids, category_id);
    res.json({ ok: true, moved: ids.length });
  })
);

app.delete(
  "/api/images/:id",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    deleteImage(id);
    res.json({ ok: true });
  })
);

app.post(
  "/api/images/batch-delete",
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids)) return res.status(400).json({ error: "ids 必须为数组" });
    batchDeleteImages(ids);
    res.json({ ok: true, deleted: ids.length });
  })
);

// 批量下载选中图片为 ZIP
app.post(
  "/api/images/batch-download",
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids 不能为空" });
    }
    const rows = getImagesByIds(ids);
    const zip = new JSZip();
    const usedNames = new Map<string, number>();
    for (const r of rows) {
      let filename = r.name;
      const used = usedNames.get(filename) ?? 0;
      if (used > 0) {
        const dotIdx = filename.lastIndexOf(".");
        if (dotIdx > 0) {
          filename = `${filename.slice(0, dotIdx)}_${used}${filename.slice(dotIdx)}`;
        } else {
          filename = `${filename}_${used}`;
        }
      }
      usedNames.set(r.name, used + 1);
      zip.file(filename, Buffer.from(r.data));
    }
    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="images.zip"`);
    res.send(buffer);
  })
);

// ============ 图集打包 ============
app.post(
  "/api/atlas/pack",
  asyncHandler(async (req, res) => {
    const { ids, options, format } = req.body as {
      ids: number[];
      options?: Partial<PackOptions>;
      format?: "zip" | "json";
    };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids 不能为空" });
    }
    const rows = getImagesByIds(ids);
    if (rows.length === 0) {
      return res.status(404).json({ error: "未找到任何图片" });
    }
    const opts: PackOptions = { ...defaultPackOptions, ...(options || {}) };
    if (format === "json") {
      const result = await packAtlas(rows, opts);
      res.json({
        baseName: result.baseName,
        width: result.width,
        height: result.height,
        pngBase64: result.pngBuffer.toString("base64"),
        plist: result.plistXml,
        rects: result.rects,
      });
      return;
    }
    const { buffer, baseName } = await packAtlasAsZip(rows, opts);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(baseName)}.zip"`
    );
    res.send(buffer);
  })
);

// ============ 错误处理 ============
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server error]", err);
  res.status(err.status || 500).json({
    error: err.message || "服务器内部错误",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n[server] SliceLab backend listening on http://localhost:${PORT}\n`);
});

// ============ 工具 ============
function parsePngSize(buf: Buffer): { width: number; height: number } | null {
  // PNG: 8 字节签名 + IHDR chunk (length=13, type='IHDR', 4 bytes width, 4 bytes height)
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    return null;
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

/** 生成 PNG 缩略图（等比缩放到 maxSize 内）。失败时返回 null。 */
async function generateThumbnail(pngBuf: Buffer, maxSize: number): Promise<Buffer | null> {
  try {
    const { PNG } = await import("pngjs");
    const png = PNG.sync.read(pngBuf);
    const { width, height } = png;
    if (width === 0 || height === 0) return null;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const tw = Math.max(1, Math.round(width * scale));
    const th = Math.max(1, Math.round(height * scale));
    const out = new PNG({ width: tw, height: th });
    // 简单最近邻缩放
    for (let y = 0; y < th; y++) {
      const sy = Math.min(height - 1, Math.floor(y / scale));
      for (let x = 0; x < tw; x++) {
        const sx = Math.min(width - 1, Math.floor(x / scale));
        const si = (sy * width + sx) * 4;
        const di = (y * tw + x) * 4;
        out.data[di] = png.data[si];
        out.data[di + 1] = png.data[si + 1];
        out.data[di + 2] = png.data[si + 2];
        out.data[di + 3] = png.data[si + 3];
      }
    }
    return PNG.sync.write(out);
  } catch (e) {
    console.error("[thumbnail] generate failed:", e);
    return null;
  }
}
