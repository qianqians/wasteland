// UITopToolbar：顶部工具栏（方案名/保存/撤销/重做/删除/对齐/缩放/关闭）
import { useState } from "react";
import { useUiEditorStore } from "@/store/useUiEditorStore";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Props {
  onClose: () => void;
}

interface AlignTool {
  type: string;
  label: string;
  minCount: number;
  isDistribute: boolean;
  icon: React.ReactNode;
}

const ALIGN_TOOLS: AlignTool[] = [
  { type: "left", label: "左对齐", minCount: 2, isDistribute: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="3" x2="3" y2="21"/><rect x="7" y="4" width="14" height="6" rx="1"/><rect x="7" y="14" width="10" height="6" rx="1"/></svg> },
  { type: "center", label: "水平居中", minCount: 2, isDistribute: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><rect x="6" y="4" width="12" height="6" rx="1"/><rect x="8" y="14" width="8" height="6" rx="1"/></svg> },
  { type: "right", label: "右对齐", minCount: 2, isDistribute: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="3" x2="21" y2="21"/><rect x="3" y="4" width="14" height="6" rx="1"/><rect x="7" y="14" width="10" height="6" rx="1"/></svg> },
  { type: "top", label: "顶对齐", minCount: 2, isDistribute: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="3" x2="21" y2="3"/><rect x="4" y="7" width="6" height="14" rx="1"/><rect x="14" y="7" width="6" height="10" rx="1"/></svg> },
  { type: "middle", label: "垂直居中", minCount: 2, isDistribute: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><rect x="4" y="6" width="6" height="12" rx="1"/><rect x="14" y="8" width="6" height="8" rx="1"/></svg> },
  { type: "bottom", label: "底对齐", minCount: 2, isDistribute: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><rect x="4" y="3" width="6" height="14" rx="1"/><rect x="14" y="7" width="6" height="10" rx="1"/></svg> },
  { type: "distributeHorizontal", label: "水平分布", minCount: 3, isDistribute: true, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="9" width="4" height="6" rx="1"/><rect x="10" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/></svg> },
  { type: "distributeVertical", label: "垂直分布", minCount: 3, isDistribute: true, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="9" y="10" width="6" height="4" rx="1"/><rect x="9" y="18" width="6" height="4" rx="1"/></svg> },
];

function IconBtn({ children, disabled, onClick, title, className = "" }: {
  children: React.ReactNode; disabled?: boolean; onClick?: () => void; title?: string; className?: string;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center w-7 h-7 border-none bg-transparent text-fg-muted rounded cursor-pointer shrink-0 transition-colors hover:bg-ink-700 hover:text-fg disabled:opacity-35 disabled:cursor-not-allowed ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export function UITopToolbar({ onClose }: Props) {
  const schemeName = useUiEditorStore((s) => s.schemeName);
  const isModified = useUiEditorStore((s) => s.isModified);
  const isSaving = useUiEditorStore((s) => s.isSaving);
  const undoStack = useUiEditorStore((s) => s.undoStack);
  const redoStack = useUiEditorStore((s) => s.redoStack);
  const selectedNodeIds = useUiEditorStore((s) => s.selectedNodeIds);
  const scale = useUiEditorStore((s) => s.scale);
  const renderVersion = useUiEditorStore((s) => s.renderVersion);
  const store = useUiEditorStore;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tip, setTip] = useState<{ open: boolean; title: string; msg: string }>({ open: false, title: "", msg: "" });

  // 计算选中控件的锁定状态（renderVersion 确保属性变更后刷新）
  void renderVersion;
  const st = store.getState();
  const selectableIds = selectedNodeIds.filter((id) => !st.getAllRootNodes().some((r) => r.id === id));
  const allLocked = selectableIds.length > 0 && selectableIds.every((id) => st.findNodeById(id)?.props.locked);
  const toggleLock = () => {
    if (selectableIds.length === 0) return;
    store.getState().updateMultipleNodesProps(selectableIds, { locked: !allLocked });
  };

  const zoomBy = (delta: number) => {
    const newPercent = Math.round(scale * 100) + delta;
    store.getState().setScale(Math.max(10, Math.min(300, newPercent)) / 100);
  };

  const onSave = async () => {
    try {
      await store.getState().saveScheme();
    } catch (e: any) {
      setTip({ open: true, title: "保存失败", msg: "无法连接到后端服务。\n\n错误信息: " + (e?.message || e) });
    }
  };

  const onDelete = () => {
    if (selectedNodeIds.length === 0) return;
    if (selectedNodeIds.length === 1 && selectedNodeIds.includes(store.getState().rootNode.id)) {
      setTip({ open: true, title: "无法删除", msg: "主根节点不能删除" });
      return;
    }
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    store.getState().deleteSelectedNodes();
    setDeleteOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ink-800 border-b border-ink-700 text-fg text-xs h-11 shrink-0">
      <input
        value={schemeName}
        onChange={(e) => {
          useUiEditorStore.setState({ schemeName: e.target.value, isModified: true });
        }}
        placeholder="方案名称"
        className="bg-transparent border-none border-b border-transparent text-fg text-[13px] font-medium px-1.5 py-1 outline-none w-40 transition-colors placeholder:text-fg-muted/50 hover:border-ink-700 focus:border-accent"
      />

      <div className="w-px h-5 bg-ink-700 mx-1 shrink-0" />

      <IconBtn disabled={isSaving || !isModified} onClick={onSave} title={isModified ? "保存" : "已保存"}
        className={isModified ? "" : "opacity-40 hover:bg-transparent"}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      </IconBtn>

      <div className="w-px h-5 bg-ink-700 mx-1 shrink-0" />

      <IconBtn disabled={undoStack.length === 0} onClick={() => store.getState().undo()} title="撤销 (Ctrl+Z)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </IconBtn>
      <IconBtn disabled={redoStack.length === 0} onClick={() => store.getState().redo()} title="重做 (Ctrl+Shift+Z)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </IconBtn>

      <div className="w-px h-5 bg-ink-700 mx-1 shrink-0" />

      <IconBtn disabled={selectedNodeIds.length === 0} onClick={onDelete} title="删除选中控件"
        className="hover:bg-danger/15 hover:text-danger">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </IconBtn>

      <div className="flex items-center gap-0.5">
        {ALIGN_TOOLS.map((tool) => (
          <IconBtn
            key={tool.type}
            disabled={selectedNodeIds.length < tool.minCount}
            onClick={() => {
              const ids = store.getState().selectedNodeIds;
              if (tool.isDistribute) store.getState().distributeNodes(ids, tool.type as any);
              else store.getState().alignNodes(ids, tool.type as any);
            }}
            title={tool.label}
          >
            {tool.icon}
          </IconBtn>
        ))}
      </div>

      <div className="w-px h-5 bg-ink-700 mx-1 shrink-0" />

      <IconBtn
        disabled={selectableIds.length === 0}
        onClick={toggleLock}
        title="锁定/解锁 (Q)"
        className={allLocked ? "text-green-400 hover:text-green-300" : ""}
      >
        {allLocked ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        )}
      </IconBtn>

      {selectedNodeIds.length >= 2 && (
        <span className="text-accent text-[11px] ml-1 shrink-0">已选 {selectedNodeIds.length}</span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-px shrink-0">
        <button onClick={() => zoomBy(-5)} title="缩小 (-5%)"
          className="w-5 h-[22px] border border-ink-700 bg-ink-700 text-fg cursor-pointer rounded text-[13px] flex items-center justify-center p-0 leading-none hover:bg-ink-600">−</button>
        <span className="inline-flex items-center justify-center bg-ink-700 text-fg border border-ink-700 rounded px-1 text-[11px] h-[22px] min-w-[46px] cursor-default select-none">
          {Math.round(scale * 100)}%
        </span>
        <button onClick={() => zoomBy(5)} title="放大 (+5%)"
          className="w-5 h-[22px] border border-ink-700 bg-ink-700 text-fg cursor-pointer rounded text-[13px] flex items-center justify-center p-0 leading-none hover:bg-ink-600">+</button>
      </div>

      <IconBtn onClick={onClose} title="关闭编辑器" className="hover:bg-danger/15 hover:text-danger">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </IconBtn>

      <ConfirmDialog
        open={deleteOpen}
        title="确认删除"
        message={`确定要删除选中的 ${selectedNodeIds.length} 个控件吗？`}
        danger
        confirmText="删除"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <ConfirmDialog
        open={tip.open}
        title={tip.title}
        message={tip.msg}
        confirmText="确定"
        hideActions
        onConfirm={() => setTip({ open: false, title: "", msg: "" })}
        onCancel={() => setTip({ open: false, title: "", msg: "" })}
      >
        <div className="flex items-center justify-end pt-2">
          <button className="btn-primary h-9 px-5 text-sm" onClick={() => setTip({ open: false, title: "", msg: "" })}>确定</button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
