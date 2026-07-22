import { create } from "zustand";
import type {
  DetectedElement,
  ProcessOptions,
  ProcessProgress,
  RGBColor,
} from "@/types";

interface ImageStore {
  // 输入
  fileName: string;
  fileUrl: string | null; // 原图 object URL
  originalImage: HTMLImageElement | null;

  // 处理参数
  options: ProcessOptions;

  // 处理结果
  processedImageData: ImageData | null;
  processedCanvasUrl: string | null; // 处理后预览 URL
  detectedBgColor: RGBColor | null;
  elements: DetectedElement[];

  // 状态
  progress: ProcessProgress;

  // actions
  setOriginal: (img: HTMLImageElement, file: File) => void;
  setOptions: (patch: Partial<ProcessOptions>) => void;
  setProgress: (p: Partial<ProcessProgress>) => void;
  setResult: (r: {
    processedImageData: ImageData;
    processedCanvasUrl: string;
    detectedBgColor?: RGBColor | null;
    elements: DetectedElement[];
  }) => void;
  toggleSelect: (id: string) => void;
  selectAll: (v: boolean) => void;
  invertSelect: () => void;
  clearResult: () => void;
  reset: () => void;
  /** 批量拆分时追加元素到现有列表（不清空已有结果） */
  appendElements: (elements: DetectedElement[]) => void;
}

const defaultOptions: ProcessOptions = {
  bgMode: "auto",
  tolerance: 12,
  antiAlias: true,
  minElementSize: 64,
  padding: 4,
  decontaminate: true,
  erodeAlpha: 0,
  contiguous: true,
};

export const useImageStore = create<ImageStore>((set) => ({
  fileName: "",
  fileUrl: null,
  originalImage: null,
  options: defaultOptions,
  processedImageData: null,
  processedCanvasUrl: null,
  detectedBgColor: null,
  elements: [],
  progress: { status: "idle", percent: 0, message: "" },

  setOriginal: (img, file) => {
    const url = URL.createObjectURL(file);
    set((s) => {
      if (s.fileUrl) URL.revokeObjectURL(s.fileUrl);
      if (s.processedCanvasUrl) URL.revokeObjectURL(s.processedCanvasUrl);
      s.elements.forEach((e) => URL.revokeObjectURL(e.url));
      return {
        fileName: file.name,
        fileUrl: url,
        originalImage: img,
        processedImageData: null,
        processedCanvasUrl: null,
        detectedBgColor: null,
        elements: [],
        progress: { status: "idle", percent: 0, message: "" },
      };
    });
  },

  setOptions: (patch) =>
    set((s) => ({ options: { ...s.options, ...patch } })),

  setProgress: (p) =>
    set((s) => ({ progress: { ...s.progress, ...p } })),

  setResult: (r) =>
    set((s) => {
      if (s.processedCanvasUrl) URL.revokeObjectURL(s.processedCanvasUrl);
      s.elements.forEach((e) => URL.revokeObjectURL(e.url));
      return {
        processedImageData: r.processedImageData,
        processedCanvasUrl: r.processedCanvasUrl,
        detectedBgColor: r.detectedBgColor ?? null,
        elements: r.elements,
        progress: { status: "done", percent: 100, message: `识别到 ${r.elements.length} 个元素` },
      };
    }),

  toggleSelect: (id) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, selected: !e.selected } : e
      ),
    })),

  selectAll: (v) =>
    set((s) => ({
      elements: s.elements.map((e) => ({ ...e, selected: v })),
    })),

  invertSelect: () =>
    set((s) => ({
      elements: s.elements.map((e) => ({ ...e, selected: !e.selected })),
    })),

  clearResult: () =>
    set((s) => {
      if (s.processedCanvasUrl) URL.revokeObjectURL(s.processedCanvasUrl);
      s.elements.forEach((e) => URL.revokeObjectURL(e.url));
      return {
        processedImageData: null,
        processedCanvasUrl: null,
        detectedBgColor: null,
        elements: [],
        progress: { status: "idle", percent: 0, message: "" },
      };
    }),

  reset: () =>
    set((s) => {
      if (s.fileUrl) URL.revokeObjectURL(s.fileUrl);
      if (s.processedCanvasUrl) URL.revokeObjectURL(s.processedCanvasUrl);
      s.elements.forEach((e) => URL.revokeObjectURL(e.url));
      return {
        fileName: "",
        fileUrl: null,
        originalImage: null,
        processedImageData: null,
        processedCanvasUrl: null,
        detectedBgColor: null,
        elements: [],
        progress: { status: "idle", percent: 0, message: "" },
        options: defaultOptions,
      };
    }),

  appendElements: (newElements) =>
    set((s) => ({ elements: [...s.elements, ...newElements] })),
}));
