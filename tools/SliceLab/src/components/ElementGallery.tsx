import { useState } from "react";
import { useImageStore } from "@/store/useImageStore";
import { downloadSingleElement } from "@/lib/download";
import { Layers, Download, Maximize2, X } from "lucide-react";
import type { DetectedElement } from "@/types";

interface ElementGalleryProps {
  baseName: string;
}

export default function ElementGallery({ baseName }: ElementGalleryProps) {
  const { elements, toggleSelect, fileName, progress } = useImageStore();
  const [preview, setPreview] = useState<DetectedElement | null>(null);

  const isEmpty = elements.length === 0;
  const isProcessing =
    progress.status === "processing" || progress.status === "loading";

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <header className="px-4 py-3 border-b border-ink-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-accent" strokeWidth={1.8} />
          <h3 className="label">元素列表</h3>
        </div>
        <span className="font-mono text-[11px] text-fg-muted">
          {elements.length} 个
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {isEmpty ? (
          <EmptyState processing={isProcessing} message={progress.message} />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {elements.map((el, idx) => (
              <ElementCard
                key={el.id}
                element={el}
                index={idx}
                onToggle={() => toggleSelect(el.id)}
                onPreview={() => setPreview(el)}
                onDownload={() => downloadSingleElement(el, baseName || fileName)}
              />
            ))}
          </div>
        )}
      </div>

      {preview && (
        <Lightbox
          element={preview}
          baseName={baseName || fileName}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function ElementCard({
  element,
  index,
  onToggle,
  onPreview,
  onDownload,
}: {
  element: DetectedElement;
  index: number;
  onToggle: () => void;
  onPreview: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className={`group relative rounded-lg border bg-ink-950 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 animate-stagger ${
        element.selected
          ? "border-accent shadow-glow"
          : "border-ink-700 hover:border-ink-600"
      }`}
      style={{ animationDelay: `${Math.min(index * 30, 400)}ms` }}
    >
      <div className="aspect-square checker-bg relative">
        <img
          src={element.url}
          alt={`element-${element.index + 1}`}
          className="absolute inset-0 w-full h-full object-contain p-2"
          draggable={false}
        />
        {/* 序号 */}
        <div className="absolute top-1.5 left-1.5 badge bg-ink-950/80 backdrop-blur text-fg-muted">
          #{String(element.index + 1).padStart(2, "0")}
        </div>
        {/* 复选框 */}
        <label className="absolute top-1.5 right-1.5 cursor-pointer">
          <input
            type="checkbox"
            className="elem-check"
            checked={element.selected}
            onChange={onToggle}
          />
        </label>
        {/* 悬停操作 */}
        <div className="absolute inset-x-0 bottom-0 p-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-ink-950 to-transparent">
          <button
            type="button"
            onClick={onPreview}
            className="flex-1 btn-ghost h-7 text-[11px] px-2"
          >
            <Maximize2 size={11} strokeWidth={1.8} />
            预览
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="flex-1 btn-primary h-7 text-[11px] px-2"
          >
            <Download size={11} strokeWidth={1.8} />
            下载
          </button>
        </div>
      </div>
      <div className="px-2 py-1.5 flex items-center justify-between text-[10px] font-mono text-fg-dim">
        <span>
          {element.width}×{element.height}
        </span>
        <span>{formatPixelCount(element.pixelCount)}</span>
      </div>
    </div>
  );
}

function EmptyState({
  processing,
  message,
}: {
  processing: boolean;
  message: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-16">
      <div className="w-14 h-14 rounded-2xl border border-ink-700 bg-ink-900 flex items-center justify-center mb-4">
        {processing ? (
          <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin-slow" />
        ) : (
          <Layers size={22} className="text-fg-dim" strokeWidth={1.4} />
        )}
      </div>
      <p className="text-sm text-fg-muted mb-1">
        {processing ? message || "处理中..." : "尚未识别到元素"}
      </p>
      <p className="text-[11px] text-fg-dim">
        {processing ? "请稍候" : "上传图片后将在此显示"}
      </p>
    </div>
  );
}

function Lightbox({
  element,
  baseName,
  onClose,
}: {
  element: DetectedElement;
  baseName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm animate-fade-in p-8"
      onClick={onClose}
    >
      <div
        className="relative max-w-[80vw] max-h-[80vh] panel p-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-ink-800 border border-ink-600 flex items-center justify-center text-fg-muted hover:text-fg hover:border-accent"
        >
          <X size={14} strokeWidth={2} />
        </button>
        <div className="checker-bg rounded-md flex items-center justify-center p-6 mb-3">
          <img
            src={element.url}
            alt={`preview-${element.index + 1}`}
            className="max-w-[70vw] max-h-[60vh] object-contain"
            draggable={false}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-mono text-fg-muted">
            <span className="text-fg">#{String(element.index + 1).padStart(3, "0")}</span>
            <span className="mx-2 text-ink-500">·</span>
            <span>{element.width} × {element.height}</span>
            <span className="mx-2 text-ink-500">·</span>
            <span>{formatPixelCount(element.pixelCount)} px</span>
          </div>
          <button
            type="button"
            onClick={() => downloadSingleElement(element, baseName)}
            className="btn-primary h-8 px-3 text-xs"
          >
            <Download size={12} strokeWidth={1.9} />
            下载 PNG
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPixelCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
