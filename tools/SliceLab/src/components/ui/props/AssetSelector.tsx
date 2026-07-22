// UI 属性面板：素材选择器
// - 显示方形槽位，有图显示图片，无图显示选择/上传按钮
// - 支持拖入：从 UIAssetPanel 拖入（dataTransfer text=asset:<id>）或外部图片文件
// - 图库弹窗：从素材库分页选择
import { useEffect, useRef, useState } from "react";
import { api, type ImageMeta } from "@/lib/api";
import { getUiAssetFileUrl } from "@/lib/uiApi";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";

export default function AssetSelector({
  label,
  assetId,
  onChange,
}: {
  label: string;
  assetId: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAsset = assetId !== "" && assetId !== undefined && assetId !== null;

  return (
    <div className="px-1">
      {label && (
        <label className="text-[11px] text-fg-muted block mb-1">{label}</label>
      )}
      <div className="flex justify-center">
        <div
          className={`relative w-[100px] h-[100px] rounded-lg border-2 overflow-hidden flex items-center justify-center checker-bg transition-colors ${
            isDragOver
              ? "border-accent border-solid bg-accent/10"
              : "border-ink-700 border-dashed"
          }`}
          onDragOver={(e) => {
            const types = Array.from(e.dataTransfer.types);
            if (types.includes("text/asset") || types.includes("Files")) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setIsDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            // 1. 内部素材库拖入
            const assetData = e.dataTransfer.getData("text/asset");
            if (assetData) {
              onChange(assetData);
              return;
            }
            // 2. 外部图片文件：上传到素材库
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              if (file.type.startsWith("image/")) {
                void api.uploadImage(file, null).then((r) => onChange(r.id));
              }
            }
          }}
        >
          {hasAsset ? (
            <>
              <img
                src={getUiAssetFileUrl(Number(assetId))}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.2";
                }}
              />
              <button
                type="button"
                onClick={() => onChange("")}
                title="移除"
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink-950/80 text-fg border border-ink-700 hover:bg-danger hover:text-white flex items-center justify-center text-xs"
              >
                <X size={11} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-1.5">
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="px-2 py-1 text-[11px] bg-ink-800 border border-ink-700 rounded text-fg hover:bg-ink-700 hover:border-accent/60 whitespace-nowrap"
              >
                图库选择
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 text-[11px] bg-ink-800 border border-ink-700 rounded text-fg hover:bg-ink-700 hover:border-accent/60 whitespace-nowrap"
              >
                上传
              </button>
            </div>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void api.uploadImage(file, null).then((r) => onChange(r.id));
          }
          e.target.value = "";
        }}
      />
      {galleryOpen && (
        <GalleryPicker
          selectedId={hasAsset ? Number(assetId) : undefined}
          onSelect={(id) => {
            onChange(id);
            setGalleryOpen(false);
          }}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}

// ============ 图库选择弹窗 ============
function GalleryPicker({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId?: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  // categoryId: undefined=全部分类, null=未分类, number=指定分类
  const [categoryId, setCategoryId] = useState<number | null | undefined>(undefined);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const LIMIT = 60;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const searchTimer = useRef<number | undefined>(undefined);

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
          <h3 className="text-sm font-medium text-fg">从素材库选择图片</h3>
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
              {images.map((img) => (
                <button
                  type="button"
                  key={img.id}
                  onClick={() => onSelect(img.id)}
                  className={`flex flex-col items-center p-1 rounded-lg border-2 transition-colors ${
                    selectedId === img.id
                      ? "border-accent bg-accent/10"
                      : "border-transparent hover:bg-ink-800 hover:border-ink-700"
                  }`}
                >
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
              ))}
            </div>
          )}
        </div>
        <div className="px-4 py-2.5 border-t border-ink-700 flex items-center justify-between">
          <span className="text-[11px] text-fg-dim font-mono">
            共 {total} 条
          </span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
