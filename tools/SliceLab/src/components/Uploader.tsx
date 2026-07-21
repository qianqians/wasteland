import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Image as ImageIcon } from "lucide-react";

interface UploaderProps {
  onFile: (file: File) => void;
  compact?: boolean;
}

const ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

export default function Uploader({ onFile, compact = false }: UploaderProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: false,
    maxFiles: 1,
  });

  if (compact) {
    return (
      <button
        {...getRootProps()}
        className={`btn-ghost h-9 px-3 ${isDragActive ? "border-accent text-accent shadow-glow" : ""}`}
        type="button"
      >
        <input {...getInputProps()} />
        <UploadCloud size={14} strokeWidth={1.8} />
        <span>更换图片</span>
      </button>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
        isDragActive
          ? "border-accent bg-accent/5 shadow-glow scale-[1.01]"
          : "border-ink-600 hover:border-ink-500 hover:bg-ink-900/40"
      }`}
      style={{ minHeight: 420 }}
    >
      <input {...getInputProps()} />
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-30" />
      <div className="relative h-full flex flex-col items-center justify-center text-center p-12">
        <div
          className={`relative mb-8 transition-transform duration-500 ${
            isDragActive ? "scale-110 -translate-y-1" : "group-hover:scale-105"
          }`}
        >
          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full animate-pulse-soft" />
          <div className="relative w-20 h-20 rounded-2xl bg-ink-900 border border-ink-700 flex items-center justify-center">
            <ImageIcon
              size={36}
              strokeWidth={1.4}
              className="text-accent"
            />
          </div>
        </div>
        <h2 className="font-display text-3xl font-semibold mb-3 tracking-tight">
          <span className="text-fg">拖入图片</span>
          <span className="text-accent"> 开始拆分</span>
        </h2>
        <p className="text-fg-muted text-sm max-w-md leading-relaxed mb-6">
          支持纯色背景或透明背景的 PNG / JPG / WEBP。
          <br />
          自动去背景 · 智能识别独立元素 · 批量导出透明 PNG
        </p>
        <div className="flex items-center gap-3">
          <span className="btn-primary">
            <UploadCloud size={15} strokeWidth={2} />
            选择图片
          </span>
          <span className="text-fg-dim text-xs font-mono">
            或拖拽到此区域
          </span>
        </div>
        <div className="mt-10 flex items-center gap-6 text-[11px] font-mono text-fg-dim uppercase tracking-widest">
          <span>PNG</span>
          <span className="w-1 h-1 rounded-full bg-ink-500" />
          <span>JPG</span>
          <span className="w-1 h-1 rounded-full bg-ink-500" />
          <span>WEBP</span>
          <span className="w-1 h-1 rounded-full bg-ink-500" />
          <span>本地处理</span>
        </div>
      </div>
    </div>
  );
}
