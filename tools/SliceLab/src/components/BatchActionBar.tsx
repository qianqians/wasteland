import { useImageStore } from "@/store/useImageStore";
import { downloadElementsAsZip } from "@/lib/download";
import { api } from "@/lib/api";
import {
  CheckSquare,
  SquareDashedMousePointer,
  Download,
  Package,
  Trash2,
  Loader2,
  FolderInput,
} from "lucide-react";
import { useState } from "react";

interface BatchActionBarProps {
  baseName: string;
  onClear: () => void;
}

export default function BatchActionBar({
  baseName,
  onClear,
}: BatchActionBarProps) {
  const { elements, selectAll, invertSelect, fileName } = useImageStore();
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const selectedCount = elements.filter((e) => e.selected).length;
  const allSelected = selectedCount === elements.length && elements.length > 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleDownloadSelected = async () => {
    if (selectedCount === 0) return;
    setDownloading(true);
    try {
      const selected = elements.filter((e) => e.selected);
      await downloadElementsAsZip(selected, baseName || fileName);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (elements.length === 0) return;
    setDownloading(true);
    try {
      await downloadElementsAsZip(elements, baseName || fileName);
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveToLibrary = async (onlySelected: boolean) => {
    const targets = onlySelected
      ? elements.filter((e) => e.selected)
      : elements;
    if (targets.length === 0) return;
    setSaving(true);
    try {
      const safeBase = (baseName || fileName || "element").replace(/\.[^.]+$/, "");
      const items = targets.map((el, idx) => ({
        name: `${safeBase}_${String(idx + 1).padStart(3, "0")}.png`,
        blob: el.blob,
        width: el.width,
        height: el.height,
        pixelCount: el.pixelCount,
        sourceFile: fileName,
      }));
      const result = await api.batchImport(items, null);
      showToast(`已入库 ${result.ids.length} 张到素材库`);
    } catch (e) {
      showToast(`入库失败：${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel px-4 py-3 flex items-center justify-between gap-3 flex-wrap relative">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-mono text-fg-muted">
          共 <span className="text-fg">{elements.length}</span> 个元素
        </span>
        <span className="text-ink-500">·</span>
        <span className="font-mono text-fg-muted">
          已选 <span className="text-accent">{selectedCount}</span> 个
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 mr-1">
          <button
            type="button"
            onClick={() => selectAll(!allSelected)}
            className="btn-ghost h-8 px-3 text-xs"
            disabled={elements.length === 0}
          >
            <CheckSquare size={13} strokeWidth={1.8} />
            {allSelected ? "取消全选" : "全选"}
          </button>
          <span className="text-ink-700">|</span>
          <button
            type="button"
            onClick={invertSelect}
            className="btn-ghost h-8 px-3 text-xs"
            disabled={elements.length === 0}
          >
            <SquareDashedMousePointer size={13} strokeWidth={1.8} />
            反选
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownloadSelected}
          disabled={selectedCount === 0 || downloading}
          className="btn-primary h-8 px-3.5 text-xs"
        >
          {downloading ? (
            <Loader2 size={13} className="animate-spin-slow" />
          ) : (
            <Download size={13} strokeWidth={1.9} />
          )}
          下载选中{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>

        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={elements.length === 0 || downloading}
          className="btn-ghost h-8 px-3.5 text-xs"
        >
          <Package size={13} strokeWidth={1.8} />
          下载全部
        </button>

        <span className="text-ink-700">|</span>

        <button
          type="button"
          onClick={() => void handleSaveToLibrary(true)}
          disabled={selectedCount === 0 || saving}
          className="btn-ghost h-8 px-3 text-xs"
          title="保存选中元素到素材库"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin-slow" />
          ) : (
            <FolderInput size={13} strokeWidth={1.8} />
          )}
          入库选中
        </button>

        <button
          type="button"
          onClick={() => void handleSaveToLibrary(false)}
          disabled={elements.length === 0 || saving}
          className="btn-ghost h-8 px-3 text-xs"
          title="保存全部元素到素材库"
        >
          <FolderInput size={13} strokeWidth={1.8} />
          入库全部
        </button>

        <span className="text-ink-700">|</span>

        <button
          type="button"
          onClick={onClear}
          disabled={elements.length === 0}
          className="btn-danger h-8 px-3 text-xs"
        >
          <Trash2 size={13} strokeWidth={1.8} />
          清空
        </button>
      </div>

      {toast && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full panel px-3 py-1.5 text-xs text-fg whitespace-nowrap animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
