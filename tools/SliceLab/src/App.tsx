import { useCallback, useEffect, useRef, useState } from "react";
import Uploader from "@/components/Uploader";
import ParameterPanel from "@/components/ParameterPanel";
import PreviewCanvas from "@/components/PreviewCanvas";
import ElementGallery from "@/components/ElementGallery";
import BatchActionBar from "@/components/BatchActionBar";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProgressOverlay from "@/components/ProgressOverlay";
import LibraryView from "@/components/LibraryView";
import AtlasBuilderView from "@/components/AtlasBuilderView";
import UIView from "@/components/ui/UIView";
import { useImageStore } from "@/store/useImageStore";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { api, type ImageMeta } from "@/lib/api";
import {
  Scissors,
  RotateCcw,
  Sparkles,
  Layers3,
  Boxes,
  LayoutTemplate,
  Library,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import type { RGBColor } from "@/types";

type Tab = "workspace" | "library" | "atlas" | "ui";

export default function App() {
  const {
    originalImage,
    fileName,
    elements,
    setOptions,
    clearResult,
    reset,
  } = useImageStore();
  const { process, processBatch } = useImageProcessor();

  const [tab, setTab] = useState<Tab>("workspace");
  const [isPicking, setIsPicking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // 处理文件
  const handleFile = useCallback(
    (file: File) => {
      void process(file);
    },
    [process]
  );

  // 重新处理
  const handleReprocess = useCallback(() => {
    void process();
  }, [process]);

  // 从素材库批量选择图片后逐一拆分
  const handleBatchFromGallery = useCallback(
    async (selectedImages: ImageMeta[]) => {
      setGalleryOpen(false);
      if (selectedImages.length === 0) return;

      // 将素材库图片 URL 转为 File 对象
      const files: File[] = [];
      for (const img of selectedImages) {
        try {
          const url = api.getImageFileUrl(img.id, img.updated_at);
          const file = await urlToFile(url, img.name);
          files.push(file);
        } catch (e) {
          console.error("拉取素材库图片失败", img.id, e);
        }
      }

      if (files.length === 0) return;
      await processBatch(files);
    },
    [processBatch]
  );

  // 吸色
  const handleStartPick = () => setIsPicking(true);
  const handlePickColor = (color: RGBColor) => {
    setOptions({ bgColor: color, bgMode: "picker" });
    setIsPicking(false);
  };

  // 关闭/刷新页面前提示
  useEffect(() => {
    if (elements.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [elements.length]);

  const baseName = fileName.replace(/\.[^.]+$/, "") || "elements";

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <header className="border-b border-ink-700 bg-ink-950/60 backdrop-blur-md sticky top-0 z-20">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full" />
              <div className="relative w-9 h-9 rounded-xl bg-ink-900 border border-ink-700 flex items-center justify-center">
                <Scissors size={17} className="text-accent" strokeWidth={2} />
              </div>
            </div>
            <div>
              <h1 className="font-display text-base font-semibold tracking-tight flex items-center gap-2">
                SliceLab
                <span className="badge bg-accent/10 text-accent border border-accent/30">
                  <Sparkles size={9} />
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-fg-dim font-mono">
                图像元素拆分器 · 素材库 · 图集打包
              </p>
            </div>
          </div>

          {/* 标签页 */}
          <nav className="flex items-center gap-1 bg-ink-900 border border-ink-700 rounded-lg p-1">
            <TabButton
              active={tab === "workspace"}
              onClick={() => setTab("workspace")}
              icon={<Scissors size={13} strokeWidth={1.8} />}
              label="工作台"
            />
            <TabButton
              active={tab === "library"}
              onClick={() => setTab("library")}
              icon={<Layers3 size={13} strokeWidth={1.8} />}
              label="素材库"
            />
            <TabButton
              active={tab === "atlas"}
              onClick={() => setTab("atlas")}
              icon={<Boxes size={13} strokeWidth={1.8} />}
              label="图集打包"
            />
            <TabButton
              active={tab === "ui"}
              onClick={() => setTab("ui")}
              icon={<LayoutTemplate size={13} strokeWidth={1.8} />}
              label="UI拼装"
            />
          </nav>

          <div className="flex items-center gap-2">
            {tab === "workspace" && originalImage && (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-ink-900 border border-ink-700 max-w-[280px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-xs font-mono text-fg-muted truncate">
                    {fileName}
                  </span>
                </div>
                <Uploader onFile={handleFile} compact />
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="btn-ghost h-9 px-3"
                  title="重置全部"
                >
                  <RotateCcw size={14} strokeWidth={1.8} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className={`flex-1 overflow-hidden ${tab === "ui" ? "" : "p-4"}`}>
        {tab === "library" ? (
          <LibraryView />
        ) : tab === "atlas" ? (
          <AtlasBuilderView />
        ) : tab === "ui" ? (
          <UIView />
        ) : !originalImage ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <Uploader onFile={handleFile} />
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="btn-ghost h-10 px-5"
                  title="从素材库选择多张图片批量拆分"
                >
                  <Library size={15} strokeWidth={1.8} />
                  <span>从素材库选择图片批量拆分</span>
                </button>
              </div>
              <FeatureRow />
            </div>
          </div>
        ) : (
          <div className="h-full grid grid-cols-12 gap-4">
            {/* 左侧参数 */}
            <div className="col-span-12 lg:col-span-3 xl:col-span-2 h-full min-h-0">
              <ParameterPanel
                onReprocess={handleReprocess}
                onPickColor={handleStartPick}
                isPicking={isPicking}
              />
            </div>

            {/* 中央预览 */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-6 h-full min-h-0 relative">
              <PreviewCanvas
                onPickColor={handlePickColor}
                isPicking={isPicking}
              />
              <ProgressOverlay />
            </div>

            {/* 右侧画廊 */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-4 h-full min-h-0 flex flex-col gap-3">
              <div className="flex-1 min-h-0">
                <ElementGallery baseName={baseName} />
              </div>
              <BatchActionBar
                baseName={baseName}
                onClear={() => setConfirmClear(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* 确认对话框 */}
      <ConfirmDialog
        open={confirmClear}
        title="清空已识别元素？"
        message="此操作将清除当前所有元素及处理结果，但保留原图。可在需要时重新处理。"
        confirmText="清空"
        danger
        onConfirm={() => {
          clearResult();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="重置全部？"
        message="此操作将清除原图、所有元素及处理结果，并恢复默认参数。"
        confirmText="重置"
        danger
        onConfirm={() => {
          reset();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />

      {/* 素材库多选弹窗 */}
      {galleryOpen && (
        <GalleryPickerMulti
          onClose={() => setGalleryOpen(false)}
          onConfirm={handleBatchFromGallery}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
        active
          ? "bg-accent text-ink-950 font-medium"
          : "text-fg-muted hover:text-fg hover:bg-ink-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FeatureRow() {
  const features = [
    { title: "智能去背景", desc: "自动识别纯色背景并移除" },
    { title: "白边优化", desc: "颜色去污染 + Alpha 收缩" },
    { title: "素材库", desc: "SQLite 入库管理 + 分类" },
    { title: "图集打包", desc: "MaxRects 排版 + Cocos plist" },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="panel p-4 hover:border-ink-600 transition-colors"
        >
          <div className="w-1 h-3 bg-accent rounded-full mb-2" />
          <h4 className="text-sm font-medium text-fg mb-1">{f.title}</h4>
          <p className="text-[11px] text-fg-dim leading-snug">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

// 将图片 URL 转为 File 对象（fetch blob → File）
async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] || "png";
  const name = filename.includes(".") ? filename : `${filename}.${ext}`;
  return new File([blob], name, { type: blob.type || "image/png" });
}

// ============ 素材库多选弹窗 ============
function GalleryPickerMulti({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (images: ImageMeta[]) => void;
}) {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  // categoryId: undefined=全部分类, null=未分类, number=指定分类
  const [categoryId, setCategoryId] = useState<number | null | undefined>(undefined);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  // 用 Map 跨页保留选中的图片元数据
  const [selectedMap, setSelectedMap] = useState<Map<number, ImageMeta>>(new Map());
  const LIMIT = 60;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const searchTimer = useRef<number | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);

  const loadPage = async (targetPage: number, catId: number | null | undefined) => {
    setLoading(true);
    try {
      const result = await api.listImages({
        search: search || undefined,
        categoryId: catId === undefined ? undefined : catId,
        limit: LIMIT,
        offset: (targetPage - 1) * LIMIT,
      });
      setImages(result.items);
      setTotal(result.total);
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  };

  // 加载分类列表
  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => {});
  }, []);

  // 搜索 / 分类变更时防抖重新加载第一页
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      void loadPage(1, categoryId);
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId]);

  useEffect(() => {
    void loadPage(1, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSelect = (img: ImageMeta) => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(img.id)) next.delete(img.id);
      else next.set(img.id, img);
      return next;
    });
  };

  const selectedList = Array.from(selectedMap.values());
  const selectedIndex = (id: number) => {
    let i = 0;
    for (const [k] of selectedMap) {
      if (k === id) return i;
      i++;
    }
    return -1;
  };

  const handleConfirm = async () => {
    if (selectedList.length === 0) return;
    setConfirming(true);
    onConfirm(selectedList);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/70 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-ink-700 flex items-center gap-3">
          <ImageIcon size={14} className="text-accent" />
          <h3 className="text-sm font-medium text-fg">从素材库选择图片（可多选）</h3>
          <div className="flex-1" />
          <select
            value={categoryId === undefined ? "" : categoryId === null ? "null" : String(categoryId)}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") setCategoryId(undefined);
              else if (v === "null") setCategoryId(null);
              else setCategoryId(Number(v));
            }}
            className="input h-8 text-xs w-32"
          >
            <option value="">全部分类</option>
            <option value="null">未分类</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="按名称搜索..."
            className="input h-8 text-xs w-40"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-fg-dim hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading && images.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={20} className="text-accent animate-spin-slow" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-fg-dim text-xs">
              素材库暂无图片
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {images.map((img) => {
                const selected = selectedMap.has(img.id);
                const order = selectedIndex(img.id);
                return (
                  <button
                    type="button"
                    key={img.id}
                    onClick={() => toggleSelect(img)}
                    className={`relative flex flex-col items-center p-1 rounded-lg border-2 transition-colors ${
                      selected
                        ? "border-accent bg-accent/10"
                        : "border-transparent hover:bg-ink-800 hover:border-ink-700"
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-accent text-ink-950 flex items-center justify-center text-[10px] font-bold z-10 border border-ink-950">
                        {order + 1}
                      </span>
                    )}
                    <div className="w-16 h-16 checker-bg rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={api.getImageThumbnailUrl(img.id, img.updated_at)}
                        alt={img.name}
                        loading="lazy"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] text-fg-muted mt-1 truncate w-full text-center">
                      {img.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-ink-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-fg-dim font-mono">
              共 {total} 条 · 已选 {selectedMap.size} 张
            </span>
            {selectedMap.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedMap(new Map())}
                className="text-[11px] text-fg-dim hover:text-fg"
              >
                清空选择
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void loadPage(page - 1, categoryId)}
              disabled={loading || page <= 1}
              className="btn-ghost h-7 px-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-[11px] text-fg font-mono min-w-[50px] text-center">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => void loadPage(page + 1, categoryId)}
              disabled={loading || page >= totalPages}
              className="btn-ghost h-7 px-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页
            </button>
            <span className="text-ink-700 mx-1">|</span>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost h-8 px-3 text-xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedMap.size === 0 || confirming}
              className="btn-primary h-8 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {confirming ? (
                <>
                  <Loader2 size={12} className="animate-spin-slow" />
                  处理中...
                </>
              ) : (
                <>确定拆分 ({selectedMap.size})</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
