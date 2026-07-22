// UIWidgetBar：左侧浮动控件栏（根节点/控件/模板/图层）
import { useEffect, useState } from "react";
import { useUiEditorStore, useUiTemplateStore, type WidgetType } from "@/store/useUiEditorStore";
import { UILayerPanel } from "./UILayerPanel";
import type { UiNode } from "@/store/useUiEditorStore";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
function reassignIds(node: UiNode) {
  node.id = uuid();
  node.children.forEach(reassignIds);
}

const WIDGET_TYPES: { type: WidgetType; label: string; icon: React.ReactNode }[] = [
  { type: "image", label: "图片", icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { type: "text", label: "文本", icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
  { type: "container", label: "容器", icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg> },
  { type: "button", label: "按钮", icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="8" width="20" height="8" rx="4"/><circle cx="8" cy="12" r="1.5" fill="currentColor"/></svg> },
  { type: "progress", label: "进度条", icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="9" width="20" height="6" rx="2"/><line x1="6" y1="9" x2="6" y2="15"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/><line x1="18" y1="9" x2="18" y2="15"/></svg> },
];

export function UIWidgetBar() {
  const store = useUiEditorStore;
  const templates = useUiTemplateStore((s) => s.templates);
  const [showLayers, setShowLayers] = useState(false);

  useEffect(() => {
    useUiTemplateStore.getState().fetchTemplates().catch(() => {});
  }, []);

  const onAddRoot = () => {
    const rootCount = store.getState().getAllRootNodes().length;
    store.getState().addRootNode(`根节点 ${rootCount + 1}`);
  };

  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("text/plain", `widget:${type}`);
  };

  const onTemplateDragStart = (e: React.DragEvent, tplId: number) => {
    e.dataTransfer.setData("text/plain", `template:${tplId}`);
  };

  const addTemplateInstance = (tpl: any) => {
    try {
      const nodeData = typeof tpl.node_data === "string" ? JSON.parse(tpl.node_data) : tpl.node_data;
      const cloned: UiNode = JSON.parse(JSON.stringify(nodeData));
      reassignIds(cloned);
      const st = store.getState();
      const activeRoot = st.getActiveRoot();
      cloned.props.x = activeRoot.children.length * 20 + 50;
      cloned.props.y = activeRoot.children.length * 20 + 50;
      cloned.name = tpl.name;
      st.pushUndo();
      activeRoot.children.push(cloned);
      st.selectNode(cloned.id);
      useUiEditorStore.setState({ isModified: true });
    } catch (err) {
      console.error("Failed to add template:", err);
    }
  };

  const btnClass =
    "flex items-center gap-1.5 px-2 py-1.5 border-none bg-transparent text-fg-muted cursor-grab rounded text-xs w-full justify-start text-left transition-colors hover:bg-ink-700 hover:text-fg active:cursor-grabbing";

  return (
    <>
      <div
        className="absolute top-3 left-3 z-50 flex flex-col gap-0.5 bg-ink-800 border border-ink-700 rounded-lg p-1.5 shadow-lg"
        style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.35)" }}
      >
        {/* 根节点按钮 */}
        <button className={`${btnClass} text-[#60a5fa] hover:bg-[#3b82f6]/15 hover:text-[#93c5fd]`} title="新建根节点" onClick={onAddRoot}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z" fill="currentColor" fillOpacity="0.3"/><line x1="12" y1="3" x2="12" y2="21" strokeDasharray="2 2"/></svg>
          <span>根节点</span>
        </button>

        <div className="h-px bg-ink-700 my-1" />

        {/* 控件按钮 */}
        {WIDGET_TYPES.map((w) => (
          <button
            key={w.type}
            className={btnClass}
            title={w.label}
            draggable
            onDragStart={(e) => onDragStart(e, w.type)}
            onClick={() => store.getState().addWidget(w.type)}
          >
            {w.icon}
            <span>{w.label}</span>
          </button>
        ))}

        {templates.length > 0 && <div className="h-px bg-ink-700 my-1" />}

        {/* 模板按钮 */}
        {templates.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <div className="text-[10px] text-fg-muted/70 px-1 py-1 uppercase tracking-wide">模板</div>
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                className={btnClass}
                title={tpl.name}
                draggable
                onDragStart={(e) => onTemplateDragStart(e, tpl.id)}
                onClick={() => addTemplateInstance(tpl)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#22c55e" }}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                <span>{tpl.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="h-px bg-ink-700 my-1" />

        {/* 图层按钮 */}
        <button
          className={`${btnClass} ${showLayers ? "bg-[#3b82f6]/20 text-[#60a5fa]" : ""}`}
          title="图层"
          onClick={() => setShowLayers(!showLayers)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          <span>图层</span>
        </button>
      </div>

      {/* 图层弹窗 */}
      {showLayers && (
        <div className="absolute top-3 left-[140px] z-50 w-64 bg-ink-800 border border-ink-700 rounded-lg shadow-xl flex flex-col max-h-[60vh]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-ink-700">
            <span className="font-semibold text-sm text-fg">图层</span>
            <button className="text-fg-muted hover:text-fg text-xs" onClick={() => setShowLayers(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <UILayerPanel hideHeader />
          </div>
        </div>
      )}
    </>
  );
}
