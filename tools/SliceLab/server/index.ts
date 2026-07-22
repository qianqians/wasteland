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
  readImagePng,
  readImageThumb,
  createImage,
  createImagesBatch,
  renameImage,
  batchRenameImages,
  updateImageData,
  moveImage,
  batchMoveImages,
  deleteImage,
  batchDeleteImages,
  getImagesByIds,
  migrateBlobsToDisk,
  type ImageRow,
  type CategoryRow,
} from "./db.js";
import { packAtlas, packAtlasAsZip, defaultPackOptions, type PackOptions } from "./atlas.js";
import { mountUiSystem } from "./ui-system.js";

const app = express();
const PORT = 5181;

app.use(cors());
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// 缩略图生成（仅返回原 PNG bytes；如需更小，可在前端展示时压缩）
const upload = multer({ storage: multer.memoryStorage() });

// ============ 启动时迁移 BLOB 到硬盘 ============
migrateBlobsToDisk();

// ============ 挂载 UI 系统 ============
mountUiSystem(app);

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
    const buf = readImagePng(id);
    if (!buf) return res.status(404).json({ error: "图片文件不存在" });
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(row.name)}"`
    );
    res.send(Buffer.from(buf));
  })
);

app.get(
  "/api/images/:id/thumbnail",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const row = getImageData(id);
    if (!row) return res.status(404).json({ error: "图片不存在" });
    const buf = readImageThumb(id);
    if (!buf) return res.status(404).json({ error: "图片文件不存在" });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(buf));
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
    // 解析图片尺寸（支持 PNG/JPEG/GIF/WebP/BMP）
    const dims = parseImageSize(req.file.buffer);
    if (!dims) {
      return res.status(400).json({ error: "无效的图片文件" });
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

// 批量改名：接收 ids 和 prefix，按顺序命名 prefix1, prefix2, ...
app.post(
  "/api/images/batch-rename",
  asyncHandler(async (req, res) => {
    const { ids, prefix } = req.body as { ids: number[]; prefix: string };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids 不能为空" });
    }
    if (!prefix || !prefix.trim()) {
      return res.status(400).json({ error: "prefix 不能为空" });
    }
    batchRenameImages(ids, prefix.trim());
    res.json({ ok: true, renamed: ids.length });
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
      const buf = readImagePng(r.id);
      if (buf) zip.file(filename, Buffer.from(buf));
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
    // 为打包器注入 PNG buffer（从硬盘读取）
    const rowsWithBuf = rows.map((r) => ({
      ...r,
      data: readImagePng(r.id) ?? r.data,
    })) as ImageRow[];
    const opts: PackOptions = { ...defaultPackOptions, ...(options || {}) };
    if (format === "json") {
      const result = await packAtlas(rowsWithBuf, opts);
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
    const { buffer, baseName } = await packAtlasAsZip(rowsWithBuf, opts);
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

/** 解析 JPEG 尺寸：遍历 markers，从 SOF0/SOF2 读取宽高 */
function parseJpegSize(buf: Buffer): { width: number; height: number } | null {
  // JPEG 以 SOI (0xFFD8) 开头
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= buf.length) {
    // 寻找 marker 起始 0xFF
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    // 跳过填充 0xFF
    while (offset < buf.length && buf[offset] === 0xff) offset++;
    if (offset >= buf.length) return null;
    const marker = buf[offset];
    offset++;
    // SOI / EOI / RSTn 无 payload
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    // SOS：后面是图像数据，停止搜索
    if (marker === 0xda) return null;
    // 读取 marker payload 长度（含长度字段自身，2 字节 big-endian）
    if (offset + 2 > buf.length) return null;
    const segLen = buf.readUInt16BE(offset);
    if (segLen < 2 || offset + segLen > buf.length) return null;
    // SOF0 (0xC0) / SOF2 (0xC2)：payload = length(2) + precision(1) + height(2) + width(2)
    if (marker === 0xc0 || marker === 0xc2) {
      if (segLen < 7) return null;
      const height = buf.readUInt16BE(offset + 3);
      const width = buf.readUInt16BE(offset + 5);
      if (width === 0 || height === 0) return null;
      return { width, height };
    }
    // 其他 marker：跳过 payload
    offset += segLen;
  }
  return null;
}

/** 解析 GIF 尺寸：逻辑屏幕描述符在 header 第 6 字节起 */
function parseGifSize(buf: Buffer): { width: number; height: number } | null {
  // GIF87a / GIF89a
  if (buf.length < 10) return null;
  if (
    buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x38
  ) return null;
  const width = buf.readUInt16LE(6);
  const height = buf.readUInt16LE(8);
  if (width === 0 || height === 0) return null;
  return { width, height };
}

/** 解析 WebP 尺寸：根据 VP8 / VP8L / VP8X chunk 读取 */
function parseWebpSize(buf: Buffer): { width: number; height: number } | null {
  // RIFF....WEBP
  if (buf.length < 30) return null;
  if (
    buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46 ||
    buf[8] !== 0x57 || buf[9] !== 0x45 || buf[10] !== 0x42 || buf[11] !== 0x50
  ) return null;
  const fourcc = buf.toString("ascii", 12, 16);
  if (fourcc === "VP8 ") {
    // lossy: 第 26 字节起 width/height 各 2 字节 LE（仅低 14 位有效）
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    if (width === 0 || height === 0) return null;
    return { width, height };
  }
  if (fourcc === "VP8L") {
    // lossless: 第 21 字节起 4 字节包含 14 位 width-1 和 14 位 height-1
    const b0 = buf[21];
    const b1 = buf[22];
    const b2 = buf[23];
    const b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    if (width === 0 || height === 0) return null;
    return { width, height };
  }
  if (fourcc === "VP8X") {
    // extended: 第 24 字节起 width-1（3 字节 LE），第 27 字节起 height-1（3 字节 LE）
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    if (width === 0 || height === 0) return null;
    return { width, height };
  }
  return null;
}

/** 解析 BMP 尺寸：DIB header 在第 14 字节起 */
function parseBmpSize(buf: Buffer): { width: number; height: number } | null {
  // BM
  if (buf.length < 26) return null;
  if (buf[0] !== 0x42 || buf[1] !== 0x4d) return null;
  const width = buf.readInt32LE(18);
  // height 可能为负（top-down），取绝对值
  const height = Math.abs(buf.readInt32LE(22));
  if (width <= 0 || height === 0) return null;
  return { width, height: height };
}

/** 根据文件头判断图片格式并解析尺寸，支持 PNG/JPEG/GIF/WebP/BMP */
function parseImageSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 12) return null;
  // PNG: \x89PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return parsePngSize(buf);
  }
  // JPEG: \xFF\xD8
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    return parseJpegSize(buf);
  }
  // GIF: GIF8
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return parseGifSize(buf);
  }
  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return parseWebpSize(buf);
  }
  // BMP: BM
  if (buf[0] === 0x42 && buf[1] === 0x4d) {
    return parseBmpSize(buf);
  }
  return null;
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
