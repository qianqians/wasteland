import { MaxRectsPacker } from "maxrects-packer";
import { PNG } from "pngjs";
import { build as plistBuild } from "plist";
import JSZip from "jszip";
import type { ImageRow } from "./db.js";

export interface PackOptions {
  /** 单图最大宽度（像素） */
  maxWidth: number;
  /** 单图最大高度（像素） */
  maxHeight: number;
  /** 元素间距（像素） */
  padding: number;
  /** 边界（像素） */
  border: number;
  /** 是否允许旋转 */
  allowRotation: boolean;
  /** 是否强制 2 的幂 */
  powerOfTwo: boolean;
  /** 是否强制正方形 */
  square: boolean;
  /** 紧凑排版：true=自动收缩画布到最小容纳尺寸；false=使用设定的最大宽高 */
  smart: boolean;
  /** 输出文件名（不含扩展名） */
  baseName: string;
  /** 是否输出为 zip（含 png + plist）；否则返回原始对象 */
  asZip: boolean;
  /** 元数据：纹理像素格式 */
  pixelFormat?: string;
}

export const defaultPackOptions: PackOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  padding: 2,
  border: 1,
  allowRotation: false,
  powerOfTwo: true,
  square: false,
  smart: false,
  baseName: "atlas",
  asZip: true,
  pixelFormat: "RGBA8888",
};

/** 向上取整到最近的 2 的幂 */
function nextPow2(n: number): number {
  if (n <= 0) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export interface PackedRect {
  imageId: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  sourceWidth: number;
  sourceHeight: number;
}

export interface PackResult {
  width: number;
  height: number;
  pngBuffer: Buffer;
  plistXml: string;
  rects: PackedRect[];
  baseName: string;
}

interface DecodedImage {
  row: ImageRow;
  png: PNG;
}

/**
 * 解码 PNG buffer 为 PNG 对象（含 RGBA 像素数据）
 */
function decodePng(buf: Buffer): Promise<PNG> {
  return new Promise((resolve, reject) => {
    new PNG().parse(buf, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

/**
 * 将指定图片打包为单张图集 PNG + Cocos2d plist。
 * 如有多页（bin 数 > 1），仅取第一页（多图集暂不在此版本支持）。
 */
export async function packAtlas(
  images: ImageRow[],
  options: PackOptions
): Promise<PackResult> {
  if (images.length === 0) {
    throw new Error("没有可选图片");
  }

  // 1. 解码所有 PNG
  const decoded: DecodedImage[] = [];
  for (const img of images) {
    try {
      const png = await decodePng(img.data);
      decoded.push({ row: img, png });
    } catch (e) {
      throw new Error(`图片 ${img.name} 解码失败: ${(e as Error).message}`);
    }
  }

  // 2. 用 maxrects-packer 排版
  const packer = new MaxRectsPacker(
    options.maxWidth,
    options.maxHeight,
    options.padding,
    {
      smart: options.smart,
      pot: options.powerOfTwo,
      square: options.square,
      allowRotation: options.allowRotation,
      border: options.border,
      tag: false,
    }
  );

  // 记录每个 rect 对应的图片信息（rect.data 用于携带自定义数据）
  const rectMeta = new Map<
    number,
    { imageId: number; name: string; sourceW: number; sourceH: number }
  >();
  let rectCounter = 0;

  for (const d of decoded) {
    const dataId = ++rectCounter;
    packer.add(d.png.width, d.png.height, { dataId });
    rectMeta.set(dataId, {
      imageId: d.row.id,
      name: d.row.name,
      sourceW: d.png.width,
      sourceH: d.png.height,
    });
  }

  const bins = packer.bins;
  if (bins.length === 0) {
    throw new Error("排版失败：未能生成任何图集页");
  }

  // 多页检查：当前版本仅支持单页图集，多页说明图片无法全部放入
  if (bins.length > 1) {
    throw new Error(
      `图片无法全部放入单个图集（${options.maxWidth}×${options.maxHeight}），` +
        `已分页为 ${bins.length} 页。请增大图集尺寸或减少图片数量。`
    );
  }

  // 取唯一一页
  const bin = bins[0];

  // 根据 pot/square 选项对画布尺寸进行修正
  let binWidth = bin.width;
  let binHeight = bin.height;

  if (options.smart) {
    // 紧凑模式：packer 已收缩到最小，再按 pot/square 向上取整
    if (options.powerOfTwo) {
      binWidth = nextPow2(binWidth);
      binHeight = nextPow2(binHeight);
    }
    if (options.square) {
      const max = Math.max(binWidth, binHeight);
      binWidth = max;
      binHeight = max;
    }
  } else {
    // 非紧凑模式：使用用户设定的最大宽高
    binWidth = options.maxWidth;
    binHeight = options.maxHeight;
    if (options.powerOfTwo) {
      binWidth = nextPow2(binWidth);
      binHeight = nextPow2(binHeight);
    }
    if (options.square) {
      const max = Math.max(binWidth, binHeight);
      binWidth = max;
      binHeight = max;
    }
  }

  // 3. 创建合成 PNG
  const outPng = new PNG({ width: binWidth, height: binHeight });
  // pngjs 默认填充 0（完全透明），无需额外清零

  const rects: PackedRect[] = [];

  for (const rect of bin.rects) {
    const dataId = (rect.data as any)?.dataId as number | undefined;
    if (dataId === undefined) continue;
    const meta = rectMeta.get(dataId);
    if (!meta) continue;

    // 找到对应的解码图片
    const decodedImg = decoded.find((d) => d.row.id === meta.imageId);
    if (!decodedImg) continue;

    const src = decodedImg.png;
    const rotated = !!rect.rot;

    if (rotated) {
      // 旋转 90°（顺时针）：源 (x, y) → 目标 (rect.x + src.height - 1 - y, rect.y + x)
      for (let y = 0; y < src.height; y++) {
        for (let x = 0; x < src.width; x++) {
          const srcIdx = (src.width * y + x) << 2;
          const dx = rect.x + (src.height - 1 - y);
          const dy = rect.y + x;
          const dstIdx = (binWidth * dy + dx) << 2;
          outPng.data[dstIdx] = src.data[srcIdx];
          outPng.data[dstIdx + 1] = src.data[srcIdx + 1];
          outPng.data[dstIdx + 2] = src.data[srcIdx + 2];
          outPng.data[dstIdx + 3] = src.data[srcIdx + 3];
        }
      }
    } else {
      // 直接拷贝（pngjs bitblt 在相同位深下安全）
      PNG.bitblt(
        src,
        outPng,
        0,
        0,
        src.width,
        src.height,
        rect.x,
        rect.y
      );
    }

    // rect.width / rect.height 已被 packer 在旋转时自动交换
    rects.push({
      imageId: meta.imageId,
      name: meta.name,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      rotated,
      sourceWidth: src.width,
      sourceHeight: src.height,
    });
  }

  // 4. 编码 PNG
  const pngBuffer = PNG.sync.write(outPng);

  // 5. 生成 Cocos2d plist（format 3）
  const baseName = options.baseName || "atlas";
  const textureFileName = `${baseName}.png`;

  const frames: Record<string, any> = {};
  for (const r of rects) {
    // frame 顺序：{{x, y}, {w, h}}，Cocos2d 原点在左上角
    frames[r.name] = {
      aliases: [],
      spriteOffset: "{0,0}",
      spriteSize: `{${r.width},${r.height}}`,
      spriteSourceSize: `{${r.sourceWidth},${r.sourceHeight}}`,
      textureRect: `{{${r.x},${r.y}},{${r.width},${r.height}}}`,
      textureRotated: r.rotated,
    };
  }

  const plistObj = {
    metadata: {
      format: 3,
      pixelFormat: options.pixelFormat || "RGBA8888",
      premultiplyAlpha: false,
      realTextureFileName: textureFileName,
      size: `{${binWidth},${binHeight}}`,
      textureFileName,
    },
    frames,
  };

  const plistXml = plistBuild(plistObj);

  return {
    width: binWidth,
    height: binHeight,
    pngBuffer,
    plistXml,
    rects,
    baseName,
  };
}

/**
 * 打包图集并以 ZIP 形式返回（包含 atlas.png + atlas.plist）。
 */
export async function packAtlasAsZip(
  images: ImageRow[],
  options: PackOptions
): Promise<{ buffer: Buffer; baseName: string }> {
  const result = await packAtlas(images, options);
  const zip = new JSZip();
  zip.file(`${result.baseName}.png`, result.pngBuffer);
  zip.file(`${result.baseName}.plist`, result.plistXml);
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return { buffer, baseName: result.baseName };
}
