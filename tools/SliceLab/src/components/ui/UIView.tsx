// UIView：UI 管理主视图（列表模式 + 编辑器模式）
// 列表模式：方案列表 + 分类管理（localStorage）+ 批量操作
// 编辑器模式：UITopToolbar + UIEditorCanvas + UIWidgetBar + 右侧面板(素材库/属性/图层)
import { useCallback, useEffect, useMemo, useState } from "react";
import { schemeApi, type UiSchemeMeta } from "@/lib/uiApi";
import { useUiEditorStore } from "@/store/useUiEditorStore";
import ConfirmDialog from "@/components/ConfirmDialog";
import { UITopToolbar } from "./UITopToolbar";
import { UIEditorCanvas } from "./UIEditorCanvas";
import { UIWidgetBar } from "./UIWidgetBar";
import { UIAssetPanel } from "./UIAssetPanel";
import { UIPropertyPanel } from "./UIPropertyPanel";
import { UILayerPanel } from "./UILayerPanel";

// ============ 分类持久化（localStorage，与参考项目一致） ============
const STORAGE_KEY_CATS = "slicelab-ui-categories";
const STORAGE_KEY_MAPPING = "slicelab-ui-scheme-cats";

interface UiCategory {
  id: string;
  name: string;
}

function loadCategories(): UiCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATS);
    return raw ? (JSON.parse(raw) as UiCategory[]) : [];
  } catch {
    return [];
  }
}
function saveCategories(cats: UiCategory[]) {
  localStorage.setItem(STORAGE_KEY_CATS, JSON.stringify(cats));
}
function loadMapping(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAPPING);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveMapping(m: Record<number, string>) {
  localStorage.setItem(STORAGE_KEY_MAPPING, JSON.stringify(m));
}

// ============ 组件 ============
type Mode = "list" | "editor";
type RightTab = "asset" | "properties" | "layers";

export default function UIView() {
  const [mode, setMode] = useState<Mode>("list");
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<UiSchemeMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 分类
  const [categories, setCategories] = useState<UiCategory[]>(loadCategories);
  const [schemeCatMap, setSchemeCatMap] = useState<Record<number, string>>(loadMapping);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // 列表状态
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 对话框
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [renamingCat, setRenamingCat] = useState<UiCategory | null>(null);
  const [renameCatName, setRenameCatName] = useState("");
  const [deleteCatTarget, setDeleteCatTarget] = useState<UiCategory | null>(null);
  const [deleteSchemeTarget, setDeleteSchemeTarget] = useState<UiSchemeMeta | null>(null);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchMoveOpen, setBatchMoveOpen] = useState(false);
  const [batchMoveCatId, setBatchMoveCatId] = useState<string>("");
  const [singleMoveTarget, setSingleMoveTarget] = useState<UiSchemeMeta | null>(null);
  const [singleMoveCatId, setSingleMoveCatId] = useState<string>("");
  const [closeEditorOpen, setCloseEditorOpen] = useState(false);
  const [tip, setTip] = useState<{ open: boolean; title: string; msg: string }>({ open: false, title: "", msg: "" });

  // 切换 Tab 回来时恢复编辑器状态（store 中的 isEditorActive 保持不丢）
  useEffect(() => {
    if (useUiEditorStore.getState().isEditorActive) {
      setMode("editor");
    }
  }, []);

  // 编辑器右侧 Tab
  const [rightTab, setRightTab] = useState<RightTab>("asset");

  // ============ 数据加载 ============
  const loadSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await schemeApi.list();
      setSchemes(list);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  // ============ 分类操作 ============
  const persistCats = (next: UiCategory[]) => {
    setCategories(next);
    saveCategories(next);
  };
  const persistMap = (next: Record<number, string>) => {
    setSchemeCatMap(next);
    saveMapping(next);
  };

  const doAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categories.some((c) => c.name === name)) {
      setTip({ open: true, title: "提示", msg: "分类名已存在" });
      return;
    }
    const cat: UiCategory = { id: `cat_${Date.now()}`, name };
    persistCats([...categories, cat]);
    setNewCatName("");
    setAddCatOpen(false);
  };

  const doRenameCategory = () => {
    if (!renamingCat) return;
    const name = renameCatName.trim();
    if (!name) return;
    if (categories.some((c) => c.id !== renamingCat.id && c.name === name)) {
      setTip({ open: true, title: "提示", msg: "分类名已存在" });
      return;
    }
    persistCats(categories.map((c) => (c.id === renamingCat.id ? { ...c, name } : c)));
    setRenamingCat(null);
    setRenameCatName("");
  };

  const doDeleteCategory = () => {
    if (!deleteCatTarget) return;
    const next = categories.filter((c) => c.id !== deleteCatTarget.id);
    persistCats(next);
    const nextMap = { ...schemeCatMap };
    for (const k of Object.keys(nextMap)) {
      if (nextMap[Number(k)] === deleteCatTarget.id) delete nextMap[Number(k)];
    }
    persistMap(nextMap);
    if (activeCategory === deleteCatTarget.id) setActiveCategory("all");
    setDeleteCatTarget(null);
  };

  // ============ 方案操作 ============
  const createNewUI = async () => {
    const store = useUiEditorStore.getState();
    store.newScheme();
    store.setEditorActive(true);
    setMode("editor");
    setRightTab("asset");
  };

  const editScheme = async (s: UiSchemeMeta) => {
    try {
      const store = useUiEditorStore.getState();
      await store.loadScheme(s.id);
      store.setEditorActive(true);
      setMode("editor");
      setRightTab("asset");
    } catch (e: any) {
      setTip({ open: true, title: "加载失败", msg: e?.message || String(e) });
    }
  };

  const doDeleteScheme = async () => {
    if (!deleteSchemeTarget) return;
    try {
      await schemeApi.delete(deleteSchemeTarget.id);
      const nextMap = { ...schemeCatMap };
      delete nextMap[deleteSchemeTarget.id];
      persistMap(nextMap);
      setDeleteSchemeTarget(null);
      loadSchemes();
    } catch (e: any) {
      setTip({ open: true, title: "删除失败", msg: e?.message || String(e) });
    }
  };

  const doBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => schemeApi.delete(id)));
      const nextMap = { ...schemeCatMap };
      for (const id of selectedIds) delete nextMap[id];
      persistMap(nextMap);
      setSelectedIds([]);
      setBatchDeleteOpen(false);
      loadSchemes();
    } catch (e: any) {
      setTip({ open: true, title: "批量删除失败", msg: e?.message || String(e) });
    }
  };

  const doBatchMove = () => {
    if (selectedIds.length === 0 || !batchMoveCatId) return;
    const next = { ...schemeCatMap };
    for (const id of selectedIds) {
      if (batchMoveCatId === "uncategorized") delete next[id];
      else next[id] = batchMoveCatId;
    }
    persistMap(next);
    setSelectedIds([]);
    setBatchMoveOpen(false);
    setBatchMoveCatId("");
  };

  const doSingleMove = () => {
    if (!singleMoveTarget || !singleMoveCatId) return;
    const next = { ...schemeCatMap };
    if (singleMoveCatId === "uncategorized") delete next[singleMoveTarget.id];
    else next[singleMoveTarget.id] = singleMoveCatId;
    persistMap(next);
    setSingleMoveTarget(null);
    setSingleMoveCatId("");
  };

  // ============ 关闭编辑器 ============
  const onCloseEditor = () => {
    const store = useUiEditorStore.getState();
    if (store.isModified) {
      setCloseEditorOpen(true);
    } else {
      doCloseWithoutSave();
    }
  };
  const doCloseWithoutSave = () => {
    useUiEditorStore.getState().exitEditor();
    setMode("list");
    setCloseEditorOpen(false);
    loadSchemes();
  };
  const doCloseWithSave = async () => {
    const store = useUiEditorStore.getState();
    try {
      await store.saveScheme();
      useUiEditorStore.getState().exitEditor();
      setMode("list");
      setCloseEditorOpen(false);
      loadSchemes();
    } catch (e: any) {
      setTip({ open: true, title: "保存失败", msg: e?.message || String(e) });
    }
  };

  // ============ 选择 ============
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) => (prev.length === filteredSchemes.length ? [] : filteredSchemes.map((s) => s.id)));
  };

  // ============ 计算属性 ============
  const uncategorizedCount = useMemo(
    () => schemes.filter((s) => !schemeCatMap[s.id]).length,
    [schemes, schemeCatMap]
  );
  const filteredSchemes = useMemo(() => {
    let list = schemes;
    if (activeCategory === "uncategorized") {
      list = list.filter((s) => !schemeCatMap[s.id]);
    } else if (activeCategory !== "all") {
      list = list.filter((s) => schemeCatMap[s.id] === activeCategory);
    }
    const kw = searchKeyword.trim().toLowerCase();
    if (kw) list = list.filter((s) => (s.name || "").toLowerCase().includes(kw));
    return list;
  }, [schemes, activeCategory, searchKeyword, schemeCatMap]);

  const isAllSelected = filteredSchemes.length > 0 && filteredSchemes.every((s) => selectedIds.includes(s.id));
  const getCategoryName = (sid: number) => {
    const cid = schemeCatMap[sid];
    if (!cid) return "未分类";
    return categories.find((c) => c.id === cid)?.name || "未分类";
  };
  const getCategoryCount = (cid: string) =>
    schemes.filter((s) => schemeCatMap[s.id] === cid).length;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    } catch {
      return iso;
    }
  };

  // ============ 编辑器模式 ============
  if (mode === "editor") {
    return (
      <div className="h-full flex flex-col bg-ink-950 overflow-hidden">
        <UITopToolbar onClose={onCloseEditor} />
        <div className="flex-1 flex min-h-0 relative">
          {/* 左侧浮动控件栏 */}
          <UIWidgetBar />
          {/* 中央画布 */}
          <div className="flex-1 min-w-0 flex">
            <UIEditorCanvas />
          </div>
          {/* 右侧面板 */}
          <div className="w-[320px] shrink-0 flex flex-col border-l border-ink-700 bg-ink-900">
            {/* Tab 切换 */}
            <div className="flex border-b border-ink-700 shrink-0">
              {(["asset", "properties", "layers"] as RightTab[]).map((t) => (
                <button
                  key={t}
                  className={`flex-1 px-2 py-2 text-[11px] font-medium transition-colors ${rightTab === t ? "text-accent border-b-2 border-accent bg-ink-800" : "text-fg-muted hover:text-fg hover:bg-ink-800"}`}
                  onClick={() => setRightTab(t)}
                >
                  {t === "asset" ? "素材库" : t === "properties" ? "属性" : "图层"}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0">
              {rightTab === "asset" && <UIAssetPanel />}
              {rightTab === "properties" && <UIPropertyPanel />}
              {rightTab === "layers" && <UILayerPanel />}
            </div>
          </div>
        </div>

        {/* 关闭编辑器确认 */}
        <ConfirmDialog
          open={closeEditorOpen}
          title="保存修改？"
          message="是否保存当前方案的修改？"
          hideActions
          onCancel={() => setCloseEditorOpen(false)}
        >
          <div className="flex items-center justify-end gap-2 pt-2">
            <button className="btn-ghost h-9 px-4 text-sm" onClick={() => setCloseEditorOpen(false)}>取消</button>
            <button className="btn-danger h-9 px-4 text-sm" onClick={doCloseWithoutSave}>不保存</button>
            <button className="btn-primary h-9 px-4 text-sm" onClick={doCloseWithSave}>保存</button>
          </div>
        </ConfirmDialog>

        {/* 错误提示 */}
        <ConfirmDialog
          open={tip.open}
          title={tip.title}
          message={tip.msg}
          hideActions
          onCancel={() => setTip({ ...tip, open: false })}
        >
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              className="btn-primary h-9 px-4 text-sm"
              onClick={() => setTip({ ...tip, open: false })}
            >
              确定
            </button>
          </div>
        </ConfirmDialog>
      </div>
    );
  }

  // ============ 列表模式 ============
  return (
    <div className="h-full flex flex-col panel overflow-hidden">
      {/* 顶部分类栏 */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-ink-700 overflow-x-auto">
        <div className="flex items-center gap-1">
          <CategoryChip
            active={activeCategory === "all"}
            name="全部"
            count={schemes.length}
            onClick={() => setActiveCategory("all")}
          />
          <CategoryChip
            active={activeCategory === "uncategorized"}
            name="未分类"
            count={uncategorizedCount}
            onClick={() => setActiveCategory("uncategorized")}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              active={activeCategory === cat.id}
              name={cat.name}
              count={getCategoryCount(cat.id)}
              onClick={() => setActiveCategory(cat.id)}
              onRename={() => { setRenamingCat(cat); setRenameCatName(cat.name); }}
              onDelete={() => setDeleteCatTarget(cat)}
            />
          ))}
        </div>
        <button className="btn-ghost h-7 px-2 text-xs shrink-0" onClick={() => setAddCatOpen(true)}>
          + 添加分类
        </button>
      </div>

      {/* 工具栏 */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 border-b border-ink-700">
        <div className="flex items-center gap-1.5">
          <button className="btn-primary h-8 px-3 text-xs" onClick={createNewUI}>
            + 新建UI
          </button>
          {schemes.length > 0 && (
            <>
              <button
                className="btn-ghost h-8 px-3 text-xs"
                onClick={toggleSelectAll}
              >
                {isAllSelected ? "取消全选" : "全选"}
              </button>
              <span className="text-fg-muted">|</span>
              <button
                className="btn-ghost h-8 px-3 text-xs"
                disabled={selectedIds.length === 0}
                onClick={() => setBatchMoveOpen(true)}
              >
                移动选中 ({selectedIds.length})
              </button>
              <button
                className="btn-danger h-8 px-3 text-xs"
                disabled={selectedIds.length === 0}
                onClick={() => setBatchDeleteOpen(true)}
              >
                删除选中 ({selectedIds.length})
              </button>
            </>
          )}
          <button className="btn-ghost h-8 px-3 text-xs" onClick={loadSchemes} title="刷新">
            刷新
          </button>
        </div>
        <div className="relative w-64">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索方案名..."
            className="w-full h-8 pl-7 pr-2 text-xs bg-ink-800 border border-ink-700 rounded text-fg placeholder:text-fg-muted/60 focus:outline-none focus:border-accent/50"
          />
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* 方案列表 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {error && (
          <div className="text-danger text-sm p-4 text-center">{error}</div>
        )}
        {!error && !loading && filteredSchemes.length === 0 && (
          <div className="text-fg-muted text-sm p-8 text-center">
            暂无方案，点击"新建UI"创建
          </div>
        )}
        {loading && (
          <div className="text-fg-muted text-sm p-8 text-center">加载中...</div>
        )}
        {filteredSchemes.length > 0 && (
          <div className="w-full">
            {/* 表头 */}
            <div className="grid items-center px-4 py-2 border-b border-ink-700 text-[11px] font-medium text-fg-muted sticky top-0 bg-ink-900 z-10" style={{ gridTemplateColumns: "32px 1fr 100px 110px 60px 140px 200px" }}>
              <div className="cursor-pointer" onClick={toggleSelectAll}>
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isAllSelected ? "bg-accent border-accent" : "border-ink-600"}`}>
                  {isAllSelected && (
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#0E0F13" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </div>
              </div>
              <div>方案名</div>
              <div>分类</div>
              <div>画布尺寸</div>
              <div>版本</div>
              <div>更新时间</div>
              <div className="text-right">操作</div>
            </div>
            {/* 行 */}
            {filteredSchemes.map((s) => {
              const checked = selectedIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  className="grid items-center px-4 py-2 border-b border-ink-700/50 text-xs hover:bg-ink-800/50"
                  style={{ gridTemplateColumns: "32px 1fr 100px 110px 60px 140px 200px" }}
                >
                  <div className="cursor-pointer" onClick={() => toggleSelect(s.id)}>
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${checked ? "bg-accent border-accent" : "border-ink-600"}`}>
                      {checked && (
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#0E0F13" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </div>
                  </div>
                  <div
                    className="text-fg truncate cursor-pointer hover:text-accent"
                    title={s.name}
                    onClick={() => editScheme(s)}
                  >
                    {s.name}
                  </div>
                  <div className="text-fg-muted truncate">{getCategoryName(s.id)}</div>
                  <div className="text-fg-muted">{s.canvas_width}×{s.canvas_height}</div>
                  <div className="text-fg-muted">v{s.version}</div>
                  <div className="text-fg-muted">{formatDate(s.updated_at)}</div>
                  <div className="flex items-center justify-end gap-1">
                    <button className="btn-ghost h-6 px-2 text-[11px]" onClick={() => editScheme(s)}>编辑</button>
                    <button className="btn-ghost h-6 px-2 text-[11px]" onClick={() => { setSingleMoveTarget(s); setSingleMoveCatId(schemeCatMap[s.id] || "uncategorized"); }}>移动</button>
                    <button className="btn-danger h-6 px-2 text-[11px]" onClick={() => setDeleteSchemeTarget(s)}>删除</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 添加分类对话框 */}
      <ConfirmDialog
        open={addCatOpen}
        title="添加分类"
        confirmText="添加"
        cancelText="取消"
        onConfirm={doAddCategory}
        onCancel={() => { setAddCatOpen(false); setNewCatName(""); }}
      >
        <div className="space-y-2">
          <label className="text-xs text-fg-muted">分类名称</label>
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="输入分类名称"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") doAddCategory(); }}
            className="w-full h-9 px-2 text-sm bg-ink-800 border border-ink-700 rounded text-fg focus:outline-none focus:border-accent/50"
          />
        </div>
      </ConfirmDialog>

      {/* 重命名分类 */}
      <ConfirmDialog
        open={!!renamingCat}
        title="重命名分类"
        confirmText="保存"
        cancelText="取消"
        onConfirm={doRenameCategory}
        onCancel={() => { setRenamingCat(null); setRenameCatName(""); }}
      >
        <div className="space-y-2">
          <label className="text-xs text-fg-muted">分类名称</label>
          <input
            type="text"
            value={renameCatName}
            onChange={(e) => setRenameCatName(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") doRenameCategory(); }}
            className="w-full h-9 px-2 text-sm bg-ink-800 border border-ink-700 rounded text-fg focus:outline-none focus:border-accent/50"
          />
        </div>
      </ConfirmDialog>

      {/* 删除分类确认 */}
      <ConfirmDialog
        open={!!deleteCatTarget}
        title="删除分类"
        message={`确定要删除分类"${deleteCatTarget?.name}"吗？该分类下的方案将移到"未分类"。`}
        confirmText="确定删除"
        cancelText="取消"
        danger
        onConfirm={doDeleteCategory}
        onCancel={() => setDeleteCatTarget(null)}
      />

      {/* 删除方案确认 */}
      <ConfirmDialog
        open={!!deleteSchemeTarget}
        title="删除方案"
        message={`确定要删除方案"${deleteSchemeTarget?.name}"吗？`}
        confirmText="确定删除"
        cancelText="取消"
        danger
        onConfirm={doDeleteScheme}
        onCancel={() => setDeleteSchemeTarget(null)}
      />

      {/* 批量删除确认 */}
      <ConfirmDialog
        open={batchDeleteOpen}
        title="批量删除"
        message={`确定要删除选中的 ${selectedIds.length} 个方案吗？`}
        confirmText="确定删除"
        cancelText="取消"
        danger
        onConfirm={doBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
      />

      {/* 批量移动 */}
      <ConfirmDialog
        open={batchMoveOpen}
        title="移动到分类"
        message={`将选中的 ${selectedIds.length} 个方案移动到指定分类`}
        confirmText="移动"
        cancelText="取消"
        onConfirm={doBatchMove}
        onCancel={() => { setBatchMoveOpen(false); setBatchMoveCatId(""); }}
      >
        <div className="space-y-2">
          <label className="text-xs text-fg-muted">目标分类</label>
          <select
            value={batchMoveCatId}
            onChange={(e) => setBatchMoveCatId(e.target.value)}
            className="w-full h-9 px-2 text-sm bg-ink-800 border border-ink-700 rounded text-fg focus:outline-none focus:border-accent/50"
          >
            <option value="uncategorized">未分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </ConfirmDialog>

      {/* 单个移动 */}
      <ConfirmDialog
        open={!!singleMoveTarget}
        title="移动方案"
        message={`将"${singleMoveTarget?.name}"移动到指定分类`}
        confirmText="移动"
        cancelText="取消"
        onConfirm={doSingleMove}
        onCancel={() => { setSingleMoveTarget(null); setSingleMoveCatId(""); }}
      >
        <div className="space-y-2">
          <label className="text-xs text-fg-muted">目标分类</label>
          <select
            value={singleMoveCatId}
            onChange={(e) => setSingleMoveCatId(e.target.value)}
            className="w-full h-9 px-2 text-sm bg-ink-800 border border-ink-700 rounded text-fg focus:outline-none focus:border-accent/50"
          >
            <option value="uncategorized">未分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </ConfirmDialog>

      {/* 错误提示 */}
      <ConfirmDialog
        open={tip.open}
        title={tip.title}
        message={tip.msg}
        hideActions
        onCancel={() => setTip({ ...tip, open: false })}
      >
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            className="btn-primary h-9 px-4 text-sm"
            onClick={() => setTip({ ...tip, open: false })}
          >
            确定
          </button>
        </div>
      </ConfirmDialog>
    </div>
  );
}

// ============ 子组件：分类标签 ============
function CategoryChip({
  active,
  name,
  count,
  onClick,
  onRename,
  onDelete,
}: {
  active: boolean;
  name: string;
  count: number;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer transition-colors whitespace-nowrap ${active ? "bg-accent text-ink-950 font-medium" : "bg-ink-800 text-fg-muted hover:bg-ink-700 hover:text-fg"}`}
      onClick={onClick}
    >
      <span>{name}</span>
      <span className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] ${active ? "bg-ink-950/20 text-ink-950" : "bg-ink-700 text-fg-muted"}`}>
        {count}
      </span>
      {onRename && onDelete && (
        <span className="hidden group-hover:flex items-center gap-0.5 ml-1">
          <button
            className="w-4 h-4 inline-flex items-center justify-center hover:text-accent"
            title="重命名"
            onClick={(e) => { e.stopPropagation(); onRename(); }}
          >
            改
          </button>
          <button
            className="w-4 h-4 inline-flex items-center justify-center hover:text-danger"
            title="删除"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            删
          </button>
        </span>
      )}
    </div>
  );
}
