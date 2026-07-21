// 类型定义

export type BgMode = "auto" | "picker" | "transparent";

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ProcessOptions {
  /** 背景模式：自动检测 / 吸取色 / 已透明 */
  bgMode: BgMode;
  /** 当 bgMode = picker 时使用 */
  bgColor?: RGBColor;
  /** 颜色容差 0-100 */
  tolerance: number;
  /** 边缘抗锯齿 */
  antiAlias: boolean;
  /** 单元素最小像素数（小于此值视为噪点） */
  minElementSize: number;
  /** 元素外扩 padding，单位像素 */
  padding: number;
  /** 颜色去污染（消除边缘白边）：默认开 */
  decontaminate: boolean;
  /** Alpha 边缘收缩像素数（0 = 关闭，向内腐蚀 N px 彻底去白边） */
  erodeAlpha: number;
  /** 连通去背景：true=从图片四边缘洪水填充，仅移除与边缘连通的背景（保留角色内部白色）；false=全局颜色匹配（旧逻辑） */
  contiguous: boolean;
}

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DetectedElement {
  id: string;
  index: number;
  /** 元素原图坐标 */
  bbox: BBox;
  width: number;
  height: number;
  /** 元素图像 Blob（透明 PNG） */
  blob: Blob;
  /** 元素图像 object URL，供 UI 显示 */
  url: string;
  /** 像素数 */
  pixelCount: number;
  selected: boolean;
}

export interface ProcessResult {
  /** 去背景后的整体 ImageData（用于预览） */
  processedImageData: ImageData;
  /** 拆分出的元素列表 */
  elements: DetectedElement[];
  /** 检测到的背景色 */
  detectedBgColor?: RGBColor;
}

export type ProcessStatus = "idle" | "loading" | "processing" | "done" | "error";

export interface ProcessProgress {
  status: ProcessStatus;
  /** 0-100 */
  percent: number;
  message: string;
}
