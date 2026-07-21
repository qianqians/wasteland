import { useCallback } from "react";
import { useImageStore } from "@/store/useImageStore";
import { imageToCanvas, hasAlphaChannel, loadImage } from "@/lib/imageUtils";
import { removeBackground } from "@/lib/backgroundRemoval";
import {
  findConnectedRegions,
  cropRegionToPng,
} from "@/lib/connectedComponents";

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

  return { process };
}

function nextFrame(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}
