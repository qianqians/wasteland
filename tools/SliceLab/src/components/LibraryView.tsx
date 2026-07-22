import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type Category, type ImageMeta } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImageEditor from "@/components/ImageEditor";
import {
  Folder,
  FolderPlus,
  FolderInput,
  Trash2,
  Search,
  Download,
  Upload,
  RefreshCw,
  Pencil,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  X,
  Loader2,
  CheckSquare,
  SquareDashedMousePointer,
  Database,
  ListPlus,
} from "lucide-react";

/** 将分类列表构建为树结构 */
interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildTree(categories: Category[]): CategoryNode[] {
  const map = new Map<number, CategoryNode>();
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  categories.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_id !== null && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export default function LibraryView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 对话框
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addCatParent, setAddCatParent] = useState<number | null>(null);
  const [renameCat, setRenameCat] = useState<Category | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [deleteImagesOpen, setDeleteImagesOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageMeta | null>(null);
  const [batchRenameOpen, setBatchRenameOpen] = useState(false);
  const [batchRenamePrefix, setBatchRenamePrefix] = useState("");
  const [batchRenameBusy, setBatchRenameBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const searchTimer = useRef<number | undefined>(undefined);

  // 拉取分类
  const refreshCategories = useCallback(async () => {
    try {
      const data = await api.listCategories();
      setCategories(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // 拉取图片
  const refreshImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listImages({
        categoryId: selectedCategoryId,
        search: search || undefined,
        limit: 500,
      });
      setImages(result.items);
      setTotal(result.total);
      setSelectedIds(new Set());
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // 分类树
  const tree = useMemo(() => buildTree(categories), [categories]);

  // 当前批量导入的目标分类名（用于上传按钮提示）
  // 选中"全部图片"(null) 时导入为未分类
  const targetCategoryName =
    selectedCategoryId === null
      ? "未分类"
      : categories.find((c) => c.id === selectedCategoryId)?.name ?? "未分类";

  // 选中图片
  const allSelected = images.length > 0 && selectedIds.size === images.length;
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = (v: boolean) => {
    setSelectedIds(v ? new Set(images.map((i) => i.id)) : new Set());
  };
  const invertSelect = () => {
    setSelectedIds((prev) => {
      const next = new Set<number>();
      images.forEach((i) => {
        if (!prev.has(i.id)) next.add(i.id);
      });
      return next;
    });
  };

  // 操作：批量移动
  const handleBatchMove = async (target: number | null) => {
    if (selectedIds.size === 0) return;
    try {
      await api.batchMoveImages([...selectedIds], target);
      showToast(`已移动 ${selectedIds.size} 张图片`);
      void refreshImages();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 操作：批量删除
  const handleBatchDelete = async () => {
    try {
      await api.batchDeleteImages([...selectedIds]);
      showToast(`已删除 ${selectedIds.size} 张图片`);
      setDeleteImagesOpen(false);
      void refreshImages();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 操作：批量下载（ZIP）
  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    try {
      const blob = await api.batchDownloadImages([...selectedIds]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `images_${selectedIds.size}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 操作：批量改名
  const handleBatchRename = async () => {
    const prefix = batchRenamePrefix.trim();
    if (!prefix) return;
    if (selectedIds.size === 0) return;
    setBatchRenameBusy(true);
    try {
      // 按 images 数组顺序生成 ids，保证命名顺序与展示顺序一致
      const orderedIds = images
        .filter((img) => selectedIds.has(img.id))
        .map((img) => img.id);
      await api.batchRenameImages(orderedIds, prefix);
      showToast(`已重命名 ${orderedIds.length} 张图片（${prefix}1~${prefix}${orderedIds.length}）`);
      setBatchRenameOpen(false);
      setBatchRenamePrefix("");
      void refreshImages();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBatchRenameBusy(false);
    }
  };

  // 单张下载
  const handleDownload = (img: ImageMeta) => {
    const a = document.createElement("a");
    a.href = api.getImageFileUrl(img.id, img.updated_at);
    a.download = img.name;
    a.click();
  };

  // 文件上传（PNG）—— 导入到当前选中的分类，未选中分类时为未分类
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadFiles = async (files: FileList) => {
    setLoading(true);
    setError(null);
    try {
      let count = 0;
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        try {
          await api.uploadImage(f, selectedCategoryId);
          count++;
        } catch (e) {
          console.error("upload failed", f.name, e);
        }
      }
      showToast(`已导入 ${count} 张图片到「${targetCategoryName}」`);
      void refreshImages();
    } finally {
      setLoading(false);
    }
  };

  // 编辑分类名
  const [renameValue, setRenameValue] = useState("");
  useEffect(() => {
    if (renameCat) setRenameValue(renameCat.name);
  }, [renameCat]);

  const handleRenameSubmit = async () => {
    if (!renameCat || !renameValue.trim()) return;
    try {
      await api.updateCategory(renameCat.id, { name: renameValue.trim() });
      setRenameCat(null);
      void refreshCategories();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 新增分类
  const [newCatName, setNewCatName] = useState("");
  useEffect(() => {
    if (addCatOpen) setNewCatName("");
  }, [addCatOpen]);
  const handleAddCatSubmit = async () => {
    if (!newCatName.trim()) return;
    try {
      await api.createCategory(newCatName.trim(), addCatParent);
      setAddCatOpen(false);
      void refreshCategories();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 删除分类
  const handleDeleteCat = async () => {
    if (!deleteCat) return;
    try {
      await api.deleteCategory(deleteCat.id);
      setDeleteCat(null);
      // 先刷新分类，再判断当前选中分类是否还存在（子分类会被级联删除）
      const data = await api.listCategories();
      setCategories(data);
      if (selectedCategoryId !== null && !data.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(null);
      }
      void refreshImages();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // 移动分类选择
  const [moveCatForCat, setMoveCatForCat] = useState<Category | null>(null);
  const handleMoveCat = async (target: number | null) => {
    if (!moveCatForCat) return;
    try {
      await api.updateCategory(moveCatForCat.id, { parent_id: target });
      setMoveCatForCat(null);
      void refreshCategories();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="h-full grid grid-cols-12 gap-4">
      {/* 左侧：分类树 */}
      <aside className="col-span-12 md:col-span-3 lg:col-span-2 h-full min-h-0">
        <div className="panel h-full flex flex-col overflow-hidden">
          <header className="px-4 py-3 border-b border-ink-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder size={14} className="text-accent" strokeWidth={1.8} />
              <h3 className="label">分类</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddCatParent(null);
                setAddCatOpen(true);
              }}
              className="btn-ghost h-7 w-7 p-0"
              title="新增顶级分类"
            >
              <FolderPlus size={13} strokeWidth={1.8} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-2 text-sm">
            <CategoryItem
              node={null}
              level={0}
              label="全部图片"
              icon={<Database size={13} strokeWidth={1.8} />}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              count={total}
            />
            {tree.map((n) => (
              <CategoryItem
                key={n.id}
                node={n}
                level={0}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                onAddChild={(parentId) => {
                  setAddCatParent(parentId);
                  setAddCatOpen(true);
                }}
                onRename={(cat) => setRenameCat(cat)}
                onDelete={(cat) => setDeleteCat(cat)}
                onMove={(cat) => setMoveCatForCat(cat)}
              />
            ))}
            {categories.length === 0 && (
              <div className="text-[11px] text-fg-dim text-center py-6">
                暂无分类
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 右侧：图片网格 */}
      <section className="col-span-12 md:col-span-9 lg:col-span-10 h-full min-h-0 flex flex-col gap-3">
        {/* 顶部工具栏 */}
        <div className="panel px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={14} className="text-fg-dim" strokeWidth={1.8} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="按名称搜索..."
              className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-fg-dim"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-fg-dim hover:text-fg"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-fg-muted">
              共 <span className="text-fg">{total}</span> 张
            </span>
            <span className="text-ink-700">·</span>
            <span className="font-mono text-[11px] text-fg-muted">
              已选 <span className="text-accent">{selectedIds.size}</span> 张
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary h-8 px-3 text-xs"
              title={`批量导入图片到「${targetCategoryName}」（支持多选）`}
            >
              <Upload size={13} strokeWidth={1.8} />
              批量导入
              <span className="ml-1 px-1.5 py-0.5 rounded bg-ink-950/30 text-[10px] font-mono">
                {targetCategoryName}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  void handleUploadFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
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

        {/* 批量操作栏（始终可见） */}
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
              onClick={() => setBatchRenameOpen(true)}
              disabled={selectedIds.size === 0}
              className="btn-ghost h-8 px-3 text-xs"
              title="将选中图片按顺序命名为 前缀+序号"
            >
              <ListPlus size={13} strokeWidth={1.8} />
              批量改名{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CategorySelect
              categories={categories}
              placeholder="批量移动到..."
              value={null}
              disabled={selectedIds.size === 0}
              onChange={(v) => void handleBatchMove(v)}
            />
            <button
              type="button"
              onClick={handleBatchDownload}
              disabled={selectedIds.size === 0}
              className="btn-primary h-8 px-3 text-xs"
            >
              <Download size={13} strokeWidth={1.8} />
              下载选中{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
            <span className="text-ink-700">|</span>
            <button
              type="button"
              onClick={() => setDeleteImagesOpen(true)}
              disabled={selectedIds.size === 0}
              className="btn-danger h-8 px-3 text-xs"
            >
              <Trash2 size={13} strokeWidth={1.8} />
              删除选中
            </button>
          </div>
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
                  <LibraryImageCard
                    key={img.id}
                    image={img}
                    selected={selectedIds.has(img.id)}
                    onToggle={() => toggleSelect(img.id)}
                    onDownload={() => handleDownload(img)}
                    onEdit={() => setEditingImage(img)}
                    onRename={async (name) => {
                      try {
                        await api.updateImage(img.id, { name });
                        void refreshImages();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    onMove={async (catId) => {
                      try {
                        await api.updateImage(img.id, {
                          category_id: catId,
                        });
                        void refreshImages();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    onDelete={async () => {
                      try {
                        await api.deleteImage(img.id);
                        showToast("已删除");
                        void refreshImages();
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                    categories={categories}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 新增分类对话框 */}
      <ConfirmDialog
        open={addCatOpen}
        title={addCatParent !== null ? "新增子分类" : "新增分类"}
        message=""
        confirmText="创建"
        onConfirm={handleAddCatSubmit}
        onCancel={() => setAddCatOpen(false)}
      >
        <input
          autoFocus
          type="text"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAddCatSubmit();
          }}
          className="input w-full mt-3"
          placeholder="分类名称"
        />
      </ConfirmDialog>

      {/* 重命名分类对话框 */}
      <ConfirmDialog
        open={!!renameCat}
        title="重命名分类"
        message=""
        confirmText="保存"
        onConfirm={handleRenameSubmit}
        onCancel={() => setRenameCat(null)}
      >
        <input
          autoFocus
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleRenameSubmit();
          }}
          className="input w-full mt-3"
          placeholder="分类名称"
        />
      </ConfirmDialog>

      {/* 删除分类确认 */}
      <ConfirmDialog
        open={!!deleteCat}
        title="删除分类？"
        message={`将删除分类「${deleteCat?.name ?? ""}」及其所有子分类，分类下的图片会被移动到「未分类」。此操作不可撤销。`}
        confirmText="删除"
        danger
        onConfirm={handleDeleteCat}
        onCancel={() => setDeleteCat(null)}
      />

      {/* 删除图片确认 */}
      <ConfirmDialog
        open={deleteImagesOpen}
        title="删除选中图片？"
        message={`将永久删除 ${selectedIds.size} 张图片，此操作不可撤销。`}
        confirmText="删除"
        danger
        onConfirm={handleBatchDelete}
        onCancel={() => setDeleteImagesOpen(false)}
      />

      {/* 批量改名对话框 */}
      <ConfirmDialog
        open={batchRenameOpen}
        title={`批量改名（${selectedIds.size} 张）`}
        message={`输入统一前缀，将按当前列表顺序依次命名为「前缀1、前缀2、前缀3…」`}
        confirmText="改名"
        onConfirm={handleBatchRename}
        onCancel={() => {
          setBatchRenameOpen(false);
          setBatchRenamePrefix("");
        }}
      >
        <input
          autoFocus
          type="text"
          value={batchRenamePrefix}
          onChange={(e) => setBatchRenamePrefix(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && batchRenamePrefix.trim() && !batchRenameBusy) {
              void handleBatchRename();
            }
          }}
          className="input w-full mt-3"
          placeholder="例如：kong"
          disabled={batchRenameBusy}
        />
        {batchRenamePrefix.trim() && (
          <p className="text-[11px] text-fg-dim mt-2 font-mono">
            预览：{batchRenamePrefix.trim()}1, {batchRenamePrefix.trim()}2, {batchRenamePrefix.trim()}3 …
          </p>
        )}
      </ConfirmDialog>

      {/* 移动分类选择对话框 */}
      <ConfirmDialog
        open={!!moveCatForCat}
        title={`移动分类「${moveCatForCat?.name ?? ""}」到...`}
        message=""
        hideActions
        cancelText="取消"
        onCancel={() => setMoveCatForCat(null)}
      >
        <div className="mt-3 max-h-[300px] overflow-y-auto">
          <CategorySelect
            categories={categories}
            placeholder="选择父分类（或选「未分类」作为顶级）"
            value={null}
            allowTopLevel
            onChange={(v) => void handleMoveCat(v)}
          />
        </div>
      </ConfirmDialog>

      {/* 图片编辑器 */}
      {editingImage && (
        <ImageEditor
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSaved={() => {
            void refreshImages();
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 panel px-4 py-2 text-xs text-fg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

// ============ 分类项（递归） ============
function CategoryItem({
  node,
  level,
  label,
  icon,
  selectedId,
  onSelect,
  count,
  onAddChild,
  onRename,
  onDelete,
  onMove,
}: {
  node: CategoryNode | null;
  level: number;
  label?: string;
  icon?: React.ReactNode;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  count?: number;
  onAddChild?: (parentId: number) => void;
  onRename?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
  onMove?: (cat: Category) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const padLeft = 8 + level * 12;
  const hasChildren = node && node.children.length > 0;
  const active = node === null ? selectedId === null : selectedId === node.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
          active ? "bg-accent/15 text-accent" : "hover:bg-ink-800 text-fg-muted"
        }`}
        style={{ paddingLeft: padLeft }}
        onClick={() => onSelect(node?.id ?? null)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-fg-dim hover:text-fg"
          >
            {expanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {icon ?? <Folder size={13} strokeWidth={1.8} />}
        <span className="flex-1 truncate text-xs">{label ?? node!.name}</span>
        {count !== undefined && (
          <span className="font-mono text-[10px] text-fg-dim">{count}</span>
        )}
        {node && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-fg-dim hover:text-fg"
              title="更多操作"
            >
              <Pencil size={11} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-6 z-40 panel py-1 min-w-[140px] text-xs">
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      onAddChild?.(node.id);
                    }}
                  >
                    <FolderPlus size={11} /> 新增子分类
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      onRename?.(node);
                    }}
                  >
                    <Pencil size={11} /> 重命名
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false);
                      onMove?.(node);
                    }}
                  >
                    <FolderInput size={11} /> 移动到...
                  </MenuItem>
                  <MenuItem
                    danger
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(node);
                    }}
                  >
                    <Trash2 size={11} /> 删除
                  </MenuItem>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node!.children.map((c) => (
            <CategoryItem
              key={c.id}
              node={c}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-ink-800 text-left ${
        danger ? "text-danger" : "text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}

// ============ 分类选择下拉 ============
function CategorySelect({
  categories,
  placeholder,
  value,
  onChange,
  disabled,
  allowTopLevel,
}: {
  categories: Category[];
  placeholder: string;
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  allowTopLevel?: boolean;
}) {
  const tree = useMemo(() => buildTree(categories), [categories]);
  const renderOptions = (nodes: CategoryNode[], level: number): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    nodes.forEach((n) => {
      result.push(
        <option key={n.id} value={n.id}>
          {"　".repeat(level)}{level > 0 ? "└ " : ""}{n.name}
        </option>
      );
      if (n.children.length > 0) {
        result.push(...renderOptions(n.children, level + 1));
      }
    });
    return result;
  };
  return (
    <select
      className="input h-8 text-xs min-w-[180px]"
      value={value === null ? "" : String(value)}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "__top__" || v === "") onChange(null);
        else onChange(Number(v));
      }}
    >
      <option value="">{placeholder}</option>
      {allowTopLevel && <option value="__top__">— 作为顶级分类 —</option>}
      {renderOptions(tree, 0)}
    </select>
  );
}

// ============ 素材库图片卡片 ============
function LibraryImageCard({
  image,
  selected,
  onToggle,
  onDownload,
  onEdit,
  onRename,
  onMove,
  onDelete,
  categories,
}: {
  image: ImageMeta;
  selected: boolean;
  onToggle: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onRename: (name: string) => void;
  onMove: (catId: number | null) => void;
  onDelete: () => void;
  categories: Category[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(image.name);
  const [showMove, setShowMove] = useState(false);

  return (
    <div
      className={`group relative rounded-lg border bg-ink-950 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        selected
          ? "border-accent shadow-glow"
          : "border-ink-700 hover:border-ink-600"
      }`}
    >
      <div className="aspect-square checker-bg relative">
        <img
          src={api.getImageThumbnailUrl(image.id, image.updated_at)}
          alt={image.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-contain p-2 cursor-pointer ${
            selected ? "" : "opacity-90 hover:opacity-100"
          }`}
          draggable={false}
          onClick={onToggle}
          onDoubleClick={onEdit}
          title="单击选中，双击编辑"
        />
        <label className="absolute top-1.5 left-1.5 cursor-pointer">
          <input
            type="checkbox"
            className="elem-check"
            checked={selected}
            onChange={onToggle}
          />
        </label>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded bg-ink-950/80 border border-ink-700 flex items-center justify-center text-fg-muted hover:text-fg opacity-0 group-hover:opacity-100"
        >
          <Pencil size={11} />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-8 right-1.5 z-40 panel py-1 min-w-[130px] text-xs">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-ink-800 text-fg-muted text-left"
              >
                <Pencil size={11} /> 编辑
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setRenaming(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-ink-800 text-fg-muted text-left"
              >
                <Pencil size={11} /> 重命名
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowMove(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-ink-800 text-fg-muted text-left"
              >
                <FolderInput size={11} /> 移动到...
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDownload();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-ink-800 text-fg-muted text-left"
              >
                <Download size={11} /> 下载
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-ink-800 text-danger text-left"
              >
                <Trash2 size={11} /> 删除
              </button>
            </div>
          </>
        )}
      </div>
      <div className="px-2 py-1.5 flex items-center justify-between text-[10px] font-mono text-fg-dim">
        {renaming ? (
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name !== image.name) onRename(name.trim());
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (name.trim() && name !== image.name) onRename(name.trim());
                setRenaming(false);
              } else if (e.key === "Escape") {
                setName(image.name);
                setRenaming(false);
              }
            }}
            className="bg-ink-900 border border-accent/40 rounded px-1 py-0.5 text-[10px] flex-1 outline-none"
          />
        ) : (
          <span
            className="truncate flex-1"
            title={image.name}
            onDoubleClick={() => setRenaming(true)}
          >
            {image.name}
          </span>
        )}
      </div>
      <div className="px-2 pb-1.5 text-[10px] font-mono text-fg-dim">
        {image.width}×{image.height}
      </div>

      {showMove && (
        <div className="absolute inset-0 bg-ink-950/90 z-40 p-2 flex flex-col gap-1.5">
          <div className="text-[10px] text-fg-muted text-center">移动到...</div>
          <select
            autoFocus
            className="input h-7 text-[11px]"
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              onMove(v === "" ? null : Number(v));
              setShowMove(false);
            }}
          >
            <option value="">— 未分类 —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowMove(false)}
            className="btn-ghost h-6 text-[10px]"
          >
            取消
          </button>
        </div>
      )}
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
        通过「上传」按钮添加 PNG，或在工作台抠图后「入库」
      </p>
    </div>
  );
}
