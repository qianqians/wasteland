import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type Category, type ImageMeta, type PackOptions } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  Boxes,
  Folder,
  Search,
  RefreshCw,
  Loader2,
  Download,
  FileCode,
  CheckSquare,
  SquareDashedMousePointer,
  X,
  Image as ImageIcon,
  Settings2,
  Layers,
  Maximize2,
} from "lucide-react";

interface PackPreview {
  baseName: string;
  width: number;
  height: number;
  pngBase64: string;
  plist: string;
  rects: {
    imageId: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
    sourceWidth: number;
    sourceHeight: number;
  }[];
}

const defaultPackOptions: PackOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  padding: 2,
  border: 1,
  allowRotation: false,
  powerOfTwo: true,
  square: false,
  smart: false,
  baseName: "atlas",
};

export default function AtlasBuilderView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<PackOptions>(defaultPackOptions);
  const [preview, setPreview] = useState<PackPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [packing, setPacking] = useState(false);
  const [previewTab, setPreviewTab] = useState<"image" | "plist">("image");

  const searchTimer = useRef<number | undefined>(undefined);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await api.listCategories();
      setCategories(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refreshImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listImages({
        categoryId: selectedCategoryId,
        search: search || undefined,
        limit: 1000,
      });
      setImages(result.items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, search]);

  useEffect(() => {
    void refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      void refreshImages();
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [refreshImages]);

  const allSelected = images.length > 0 && selectedIds.size === images.length;
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = (v: boolean) =>
    setSelectedIds(v ? new Set(images.map((i) => i.id)) : new Set());
  const invertSelect = () => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      images.forEach((i) => {
        if (!prev.has(i.id)) next.add(i.id);
      });
      return next;
    });
  };

  // 选中的图片列表（保持选择顺序）
  const selectedImages = useMemo(
    () => images.filter((i) => selectedIds.has(i.id)),
    [images, selectedIds]
  );

  // 打包预览
  const handlePackPreview = async () => {
    if (selectedIds.size === 0) return;
    setPacking(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/atlas/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          options,
          format: "json",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "打包失败");
      }
      const data = await res.json();
      setPreview(data);
      setPreviewTab("image");
      setPreviewOpen(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPacking(false);
    }
  };

  // 下载 ZIP（PNG + plist）
  const handleDownloadZip = async () => {
    if (selectedIds.size === 0) return;
    setPacking(true);
    setError(null);
    try {
      const blob = await api.packAtlas([...selectedIds], options);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${options.baseName || "atlas"}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPacking(false);
    }
  };

  // 单独下载预览中的 PNG / plist
  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };
  const downloadText = (text: string, filename: string, mime = "application/xml") => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const totalArea = selectedImages.reduce(
    (s, i) => s + i.width * i.height,
    0
  );

  return (
    <div className="h-full grid grid-cols-12 gap-4">
      {/* 左侧：图片选择 */}
      <section className="col-span-12 lg:col-span-8 h-full min-h-0 flex flex-col gap-3">
        {/* 工具栏 */}
        <div className="panel px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Boxes size={15} className="text-accent" strokeWidth={1.8} />
            <span className="label">选择图片</span>
            <span className="text-ink-700">|</span>
            <Folder size={13} className="text-fg-dim" strokeWidth={1.8} />
            <select
              className="bg-transparent border-none outline-none text-xs text-fg-muted cursor-pointer"
              value={selectedCategoryId === null ? "" : String(selectedCategoryId)}
              onChange={(e) =>
                setSelectedCategoryId(e.target.value === "" ? null : Number(e.target.value))
              }
            >
              <option value="">全部分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="text-ink-700">|</span>
            <Search size={13} className="text-fg-dim" strokeWidth={1.8} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索..."
              className="bg-transparent border-none outline-none text-xs flex-1 min-w-[80px] placeholder:text-fg-dim"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-fg-muted">
              共 <span className="text-fg">{images.length}</span> 张 · 已选{" "}
              <span className="text-accent">{selectedIds.size}</span>
            </span>
            <button
              type="button"
              onClick={() => void refreshImages()}
              className="btn-ghost h-8 w-8 p-0"
              title="刷新"
            >
              <RefreshCw size={13} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* 批量选择栏 */}
        <div className="panel px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => selectAll(!allSelected)}
              disabled={images.length === 0}
              className="btn-ghost h-8 px-3 text-xs"
            >
              <CheckSquare size={13} strokeWidth={1.8} />
              {allSelected ? "取消全选" : "全选"}
            </button>
            <span className="text-ink-700">|</span>
            <button
              type="button"
              onClick={invertSelect}
              disabled={images.length === 0}
              className="btn-ghost h-8 px-3 text-xs"
            >
              <SquareDashedMousePointer size={13} strokeWidth={1.8} />
              反选
            </button>
            <span className="text-ink-700">|</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={selectedIds.size === 0}
              className="btn-ghost h-8 px-3 text-xs"
            >
              清空选择
            </button>
          </div>
          <span className="font-mono text-[11px] text-fg-dim">
            选中总面积: {(totalArea / 1024).toFixed(1)}k px²
          </span>
        </div>

        {/* 图片网格 */}
        <div className="panel flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3">
            {error && (
              <div className="text-danger text-xs mb-3 px-3 py-2 bg-danger/10 border border-danger/30 rounded-md">
                {error}
              </div>
            )}
            {loading && images.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 size={22} className="text-accent animate-spin-slow" />
                <p className="text-xs text-fg-muted mt-2">加载中...</p>
              </div>
            ) : images.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {images.map((img) => (
                  <SelectableImageCard
                    key={img.id}
                    image={img}
                    selected={selectedIds.has(img.id)}
                    onToggle={() => toggleSelect(img.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 右侧：选项 + 预览 */}
      <aside className="col-span-12 lg:col-span-4 h-full min-h-0 flex flex-col gap-3">
        {/* 打包选项 */}
        <div className="panel flex flex-col overflow-hidden">
          <header className="px-4 py-3 border-b border-ink-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 size={14} className="text-accent" strokeWidth={1.8} />
              <h3 className="label">打包选项</h3>
            </div>
          </header>
          <div className="px-4 py-4 space-y-4">
            <Field label="文件名（不含扩展名）">
              <input
                type="text"
                value={options.baseName}
                onChange={(e) =>
                  setOptions({ ...options, baseName: e.target.value })
                }
                className="input h-8 text-xs"
                placeholder="atlas"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`最大宽度: ${options.maxWidth}`}>
                <select
                  className="input h-8 text-xs"
                  value={options.maxWidth}
                  onChange={(e) =>
                    setOptions({ ...options, maxWidth: Number(e.target.value) })
                  }
                >
                  {[256, 512, 1024, 2048, 4096].map((v) => (
                    <option key={v} value={v}>
                      {v}px
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`最大高度: ${options.maxHeight}`}>
                <select
                  className="input h-8 text-xs"
                  value={options.maxHeight}
                  onChange={(e) =>
                    setOptions({ ...options, maxHeight: Number(e.target.value) })
                  }
                >
                  {[256, 512, 1024, 2048, 4096].map((v) => (
                    <option key={v} value={v}>
                      {v}px
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`元素间距: ${options.padding}px`}>
                <input
                  type="range"
                  min={0}
                  max={16}
                  value={options.padding}
                  onChange={(e) =>
                    setOptions({ ...options, padding: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </Field>
              <Field label={`边界留白: ${options.border}px`}>
                <input
                  type="range"
                  min={0}
                  max={16}
                  value={options.border}
                  onChange={(e) =>
                    setOptions({ ...options, border: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </Field>
            </div>

            <div className="space-y-2">
              <Toggle
                label="紧凑排版"
                hint="自动收缩画布到最小容纳尺寸，节省空间"
                checked={options.smart}
                onChange={(v) => setOptions({ ...options, smart: v })}
              />
              <Toggle
                label="允许旋转"
                hint="允许 90° 旋转以提高利用率"
                checked={options.allowRotation}
                onChange={(v) => setOptions({ ...options, allowRotation: v })}
              />
              <Toggle
                label="2 的幂尺寸"
                hint="输出尺寸为 2^n（如 1024×1024），Cocos 推荐"
                checked={options.powerOfTwo}
                onChange={(v) => setOptions({ ...options, powerOfTwo: v })}
              />
              <Toggle
                label="正方形"
                hint="强制输出为正方形"
                checked={options.square}
                onChange={(v) => setOptions({ ...options, square: v })}
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handlePackPreview}
                disabled={selectedIds.size === 0 || packing}
                className="btn-ghost h-9 px-3 text-xs flex-1"
              >
                {packing ? (
                  <Loader2 size={13} className="animate-spin-slow" />
                ) : (
                  <Layers size={13} strokeWidth={1.8} />
                )}
                预览
              </button>
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={selectedIds.size === 0 || packing}
                className="btn-primary h-9 px-3 text-xs flex-1"
              >
                {packing ? (
                  <Loader2 size={13} className="animate-spin-slow" />
                ) : (
                  <Download size={13} strokeWidth={1.9} />
                )}
                打包下载 ZIP
              </button>
            </div>
          </div>
        </div>

        {/* 预览按钮（在右侧面板中显示，点击打开大窗口） */}
        {preview && (
          <div className="panel flex-shrink-0">
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Layers size={14} className="text-accent shrink-0" strokeWidth={1.8} />
                <span className="label shrink-0">已生成预览</span>
                <span className="font-mono text-[11px] text-fg-muted truncate">
                  {preview.width} × {preview.height} · {preview.rects.length} 帧
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="btn-primary h-8 px-3 text-xs shrink-0"
                title="打开大窗口预览"
              >
                <Maximize2 size={12} strokeWidth={1.9} />
                打开预览
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* 预览大窗口（全屏 modal） */}
      {preview && previewOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-ink-950/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewOpen(false)}
        >
          <header
            className="px-5 py-3 border-b border-ink-700 flex items-center justify-between gap-4 bg-ink-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Layers size={16} className="text-accent shrink-0" strokeWidth={1.8} />
              <h3 className="label shrink-0">图集预览</h3>
              <span className="font-mono text-[11px] text-fg-muted truncate">
                {preview.baseName} · {preview.width} × {preview.height} · {preview.rects.length} 帧
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-ink-950 border border-ink-700 rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab("image")}
                  className={`px-2.5 py-1 text-[11px] rounded ${
                    previewTab === "image"
                      ? "bg-accent text-ink-950"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  图集
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("plist")}
                  className={`px-2.5 py-1 text-[11px] rounded ${
                    previewTab === "plist"
                      ? "bg-accent text-ink-950"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  plist
                </button>
              </div>
              <span className="text-ink-700">|</span>
              <button
                type="button"
                onClick={() =>
                  downloadDataUrl(
                    `data:image/png;base64,${preview.pngBase64}`,
                    `${preview.baseName}.png`
                  )
                }
                className="btn-primary h-8 px-3 text-xs"
              >
                <Download size={12} strokeWidth={1.9} />
                下载 PNG
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadText(preview.plist, `${preview.baseName}.plist`)
                }
                className="btn-ghost h-8 px-3 text-xs"
              >
                <FileCode size={12} strokeWidth={1.9} />
                下载 plist
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="btn-ghost h-8 w-8 p-0"
                title="关闭预览"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
          </header>
          <div
            className="flex-1 overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {previewTab === "image" ? (
              <div className="checker-bg rounded-md p-6 flex items-center justify-center min-h-full">
                <img
                  src={`data:image/png;base64,${preview.pngBase64}`}
                  alt="atlas preview"
                  className="max-w-full max-h-[calc(100vh-160px)] object-contain shadow-2xl"
                  draggable={false}
                />
              </div>
            ) : (
              <pre className="text-[11px] font-mono text-fg-muted whitespace-pre-wrap break-all bg-ink-900 border border-ink-700 rounded-md p-4">
                {preview.plist}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 子组件 ============

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-fg-dim font-mono mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between group"
    >
      <div className="flex flex-col items-start gap-0.5">
        <span className="label">{label}</span>
        {hint && <span className="text-[10px] text-fg-dim">{hint}</span>}
      </div>
      <span
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
          checked ? "bg-accent" : "bg-ink-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-ink-950 transition-transform ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}

function SelectableImageCard({
  image,
  selected,
  onToggle,
}: {
  image: ImageMeta;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`group relative rounded-lg border bg-ink-950 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
        selected
          ? "border-accent shadow-glow"
          : "border-ink-700 hover:border-ink-600"
      }`}
      onClick={onToggle}
    >
      <div className="aspect-square checker-bg relative">
        <img
          src={api.getImageThumbnailUrl(image.id, image.updated_at)}
          alt={image.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-2"
          draggable={false}
        />
        <label className="absolute top-1.5 left-1.5" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="elem-check"
            checked={selected}
            onChange={onToggle}
          />
        </label>
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent text-ink-950 text-[10px] flex items-center justify-center font-bold">
            ✓
          </div>
        )}
      </div>
      <div className="px-2 py-1 text-[10px] font-mono text-fg-dim truncate" title={image.name}>
        {image.name}
      </div>
      <div className="px-2 pb-1 text-[10px] font-mono text-fg-dim">
        {image.width}×{image.height}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-16">
      <div className="w-14 h-14 rounded-2xl border border-ink-700 bg-ink-900 flex items-center justify-center mb-4">
        <ImageIcon size={22} className="text-fg-dim" strokeWidth={1.4} />
      </div>
      <p className="text-sm text-fg-muted mb-1">素材库为空</p>
      <p className="text-[11px] text-fg-dim">
        请先在素材库中导入图片
      </p>
    </div>
  );
}
