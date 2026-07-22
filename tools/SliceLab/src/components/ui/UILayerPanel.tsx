// UILayerPanel：图层面板（树形展示所有节点，支持可见/锁定/层级调整）
import { useState } from "react";
import { useUiEditorStore, type UiNode } from "@/store/useUiEditorStore";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Props {
  hideHeader?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  image: "图", text: "文", container: "容", button: "按", progress: "进", root: "根",
};

function countDescendants(node: UiNode): number {
  if (!node.children) return 0;
  let count = node.children.length;
  for (const child of node.children) count += countDescendants(child);
  return count;
}

export function UILayerPanel({ hideHeader }: Props) {
  const store = useUiEditorStore;
  const renderVersion = useUiEditorStore((s) => s.renderVersion);
  const selectedNodeId = useUiEditorStore((s) => s.selectedNodeId);
  const rootNode = useUiEditorStore((s) => s.rootNode);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deleteRootOpen, setDeleteRootOpen] = useState(false);
  const [pendingDeleteRoot, setPendingDeleteRoot] = useState<string | null>(null);

  const st = store.getState();
  const allRoots = st.getAllRootNodes();
  let totalCount = 0;
  for (const root of allRoots) totalCount += 1 + countDescendants(root);

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getDepth = (nodeId: string): number => {
    let depth = 0;
    let current = nodeId;
    const roots = st.getAllRootNodes();
    while (current) {
      const parent = st.findParentById(current);
      if (!parent) break;
      depth++;
      current = parent.id;
      if (roots.some((r) => r.id === current)) break;
    }
    return depth;
  };

  const flattenWithChildren = (node: UiNode, result: UiNode[]) => {
    result.push(node);
    if (collapsed.has(node.id)) return;
    const reversed = [...node.children].reverse();
    for (const child of reversed) flattenWithChildren(child, result);
  };

  const getRootDisplayNodes = (root: UiNode): UiNode[] => {
    if (collapsed.has(root.id)) return [];
    const result: UiNode[] = [];
    const reversed = [...root.children].reverse();
    for (const child of reversed) flattenWithChildren(child, result);
    return result;
  };

  const VisIcon = ({ visible }: { visible: boolean }) => visible ? (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  );

  const LockIcon = ({ locked }: { locked: boolean }) => locked ? (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
  );

  const iconBtn = "flex items-center justify-center w-4 h-4 border-none bg-transparent text-fg-muted cursor-pointer rounded p-0 shrink-0 hover:bg-ink-700 hover:text-fg";

  const renderRow = (node: UiNode, isRoot: boolean, depth: number) => {
    const isSelected = node.id === selectedNodeId;
    const visible = node.props.visible !== false;
    const locked = !!node.props.locked;
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div
        key={node.id}
        className={`flex items-center gap-0.5 px-1 py-0.5 cursor-pointer border-l-2 transition-colors hover:bg-ink-700 ${isSelected ? "bg-[#3b82f6]/20 border-[#3b82f6]" : "border-transparent"}`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => store.getState().selectNode(node.id)}
      >
        <button className={iconBtn} title={visible ? "隐藏" : "显示"} onClick={(e) => { e.stopPropagation(); store.getState().updateNodeProps(node.id, { visible: !visible }); }}>
          <VisIcon visible={visible} />
        </button>
        <button className={`${iconBtn} ${locked ? "text-[#fbbf24]" : ""}`} title={locked ? "解锁" : "锁定"} onClick={(e) => { e.stopPropagation(); store.getState().updateNodeProps(node.id, { locked: !locked }); }}>
          <LockIcon locked={locked} />
        </button>
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-ink-700 text-fg-muted rounded text-[9px] shrink-0">{TYPE_LABELS[node.type] || node.type[0]}</span>
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-fg" title={node.name}>{node.name}</span>
        {/* 根节点删除按钮 */}
        {isRoot && node.id !== rootNode.id && (
          <button className={`${iconBtn} hover:bg-danger/15 hover:text-danger`} title="删除此根节点" onClick={(e) => { e.stopPropagation(); setPendingDeleteRoot(node.id); setDeleteRootOpen(true); }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        )}
        {/* 非根节点层级调整 */}
        {!isRoot && (
          <div className="hidden gap-px shrink-0 group-hover:flex" style={{ display: undefined }}>
            <button className={iconBtn} title="上移一层" onClick={(e) => { e.stopPropagation(); store.getState().setLayer(node.id, "up"); }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button className={iconBtn} title="下移一层" onClick={(e) => { e.stopPropagation(); store.getState().setLayer(node.id, "down"); }}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        )}
        {/* 展开/收起按钮 */}
        {hasChildren && (
          <button className={`${iconBtn} inline-flex`} title={collapsed.has(node.id) ? "展开" : "收起"} onClick={(e) => { e.stopPropagation(); toggleCollapse(node.id); }}>
            {collapsed.has(node.id) ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-ink-900 text-fg text-xs" key={renderVersion}>
      {!hideHeader && (
        <div className="flex items-center justify-between px-2.5 py-2 border-b border-ink-700 font-semibold shrink-0">
          <span>图层</span>
          <span className="bg-ink-700 text-fg-muted px-2 py-0.5 rounded-full text-[11px] font-normal">{totalCount}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1 min-h-0">
        {allRoots.map((root) => (
          <div key={root.id}>
            {renderRow(root, true, 0)}
            {getRootDisplayNodes(root).map((node) => renderRow(node, false, getDepth(node.id)))}
          </div>
        ))}
        {totalCount === 0 && (
          <div className="py-5 px-2.5 text-center text-fg-muted text-[11px]">暂无图层，点击左侧控件按钮添加</div>
        )}
      </div>
      <ConfirmDialog
        open={deleteRootOpen}
        title="确认删除根节点"
        message="确定要删除此根节点及其所有子控件吗？此操作不可撤销。"
        danger
        confirmText="删除"
        onConfirm={() => {
          if (pendingDeleteRoot) store.getState().deleteRootNode(pendingDeleteRoot);
          setPendingDeleteRoot(null);
          setDeleteRootOpen(false);
        }}
        onCancel={() => { setPendingDeleteRoot(null); setDeleteRootOpen(false); }}
      />
    </div>
  );
}
