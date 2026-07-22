import { useCallback } from "react";
import { useImageStore } from "@/store/useImageStore";
import { imageToCanvas, hasAlphaChannel, loadImage } from "@/lib/imageUtils";
import { removeBackground } from "@/lib/backgroundRemoval";
import {
  findConnectedRegions,
  cropRegionToPng,
} from "@/lib/connectedComponents";
import type { DetectedElement } from "@/types";

export function useImageProcessor() {
  const store = useImageStore();

  const process = useCallback(async (file?: File) => {
    const originalImage = store.originalImage;
    const options = store.options;

    let img = originalImage;
    if (file) {
      store.setProgress({ status: "loading", percent: 5, message: "加载图片中..." });
      img = await loadImage(file);
      store.setOriginal(img, file);
    }
    if (!img) return;

    store.setProgress({
      status: "processing",
      percent: 10,
      message: "准备画布...",
    });

    // 大图限制
    const { canvas, ctx } = imageToCanvas(img, 4000);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 自动判断透明通道：如果用户选 auto 且图片已透明，则跳过去背景
    const effectiveBgMode =
      options.bgMode === "auto" && hasAlphaChannel(img)
        ? "transparent"
        : options.bgMode;

    store.setProgress({
      status: "processing",
      percent: 25,
      message: "去除背景中...",
    });

    // 让一帧渲染
    await nextFrame();

    const { data: processed, bgColor } = removeBackground(imageData, {
      ...options,
      bgMode: effectiveBgMode,
    });

    store.setProgress({
      status: "processing",
      percent: 45,
      message: "分析连通区域...",
    });
    await nextFrame();

    const regions = findConnectedRegions(
      processed,
      options.minElementSize,
      (p) => {
        const percent = 45 + Math.round(p * 0.4);
        store.setProgress({
          status: "processing",
          percent,
          message: `分析连通区域 ${p}%`,
        });
      }
    );

    store.setProgress({
      status: "processing",
      percent: 88,
      message: `裁剪 ${regions.length} 个元素...`,
    });
    await nextFrame();

    // 按面积降序排
    regions.sort((a, b) => b.pixelCount - a.pixelCount);

    const elements = [];
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      const { blob } = await cropRegionToPng(processed, r.bbox, options.padding);
      const url = URL.createObjectURL(blob);
      elements.push({
        id: `el_${i}_${Date.now()}`,
        index: i,
        bbox: r.bbox,
        width: r.bbox.w + options.padding * 2,
        height: r.bbox.h + options.padding * 2,
        blob,
        url,
        pixelCount: r.pixelCount,
        selected: false,
      });
      if (i % 5 === 0) {
        const percent = 88 + Math.round((i / regions.length) * 12);
        store.setProgress({
          status: "processing",
          percent,
          message: `裁剪元素 ${i + 1}/${regions.length}`,
        });
        await nextFrame();
      }
    }

    // 生成处理后的整体预览 URL
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = processed.width;
    previewCanvas.height = processed.height;
    const pctx = previewCanvas.getContext("2d");
    if (!pctx) throw new Error("预览 Canvas 不可用");
    pctx.putImageData(processed, 0, 0);
    const processedCanvasUrl = previewCanvas.toDataURL("image/png");

    store.setResult({
      processedImageData: processed,
      processedCanvasUrl,
      detectedBgColor: bgColor,
      elements,
    });
  }, [store]);

  // 批量拆分：对多张图片逐一处理，结果累积到 elements 列表
  const processBatch = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const options = store.options;

    // 清空之前的结果（elements 此时为空，第一张 setOriginal 不会丢失数据）
    store.clearResult();

    let totalElements = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      store.setProgress({
        status: "processing",
        percent: Math.round((i / files.length) * 100),
        message: `批量处理 ${i + 1}/${files.length}：${file.name}`,
      });

      // 加载图片
      const img = await loadImage(file);

      // 第一张设置为原图（进入工作台模式，此时 elements 已被 clearResult 清空）
      if (i === 0) {
        store.setOriginal(img, file);
      }

      // 大图限制
      const { canvas, ctx } = imageToCanvas(img, 4000);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const effectiveBgMode =
        options.bgMode === "auto" && hasAlphaChannel(img)
          ? "transparent"
          : options.bgMode;

      await nextFrame();

      const { data: processed } = removeBackground(imageData, {
        ...options,
        bgMode: effectiveBgMode,
      });

      await nextFrame();

      const regions = findConnectedRegions(processed, options.minElementSize);

      // 按面积降序排
      regions.sort((a, b) => b.pixelCount - a.pixelCount);

      const newElements: DetectedElement[] = [];
      for (let j = 0; j < regions.length; j++) {
        const r = regions[j];
        const { blob } = await cropRegionToPng(processed, r.bbox, options.padding);
        const url = URL.createObjectURL(blob);
        newElements.push({
          id: `el_${i}_${j}_${Date.now()}`,
          index: totalElements + j,
          bbox: r.bbox,
          width: r.bbox.w + options.padding * 2,
          height: r.bbox.h + options.padding * 2,
          blob,
          url,
          pixelCount: r.pixelCount,
          selected: false,
        });
      }

      totalElements += newElements.length;
      store.appendElements(newElements);
      store.setProgress({
        status: "processing",
        percent: Math.round(((i + 1) / files.length) * 100),
        message: `批量处理 ${i + 1}/${files.length} 完成，累计 ${totalElements} 个元素`,
      });

      await nextFrame();
    }

    store.setProgress({
      status: "done",
      percent: 100,
      message: `批量识别完成，共 ${totalElements} 个元素`,
    });
  }, [store]);

  return { process, processBatch };
}

function nextFrame(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}
