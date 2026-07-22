// UIEditorCanvas：画布编辑器
// 功能：平移、缩放、选择、拖拽节点、Resize、拖入素材/控件/模板
import { useRef, useEffect, useReducer, useCallback } from "react";
import {
  useUiEditorStore,
  ROOT_GAP,
  type UiNode,
  type WidgetType,
} from "@/store/useUiEditorStore";
import { useUiTemplateStore } from "@/store/useUiEditorStore";
import { UIRenderer } from "./UIRenderer";
import { api } from "@/lib/api";

interface ResizeHandle {
  cursor: string;
  alignX: "left" | "center" | "right";
  alignY: "top" | "center" | "bottom";
  xOff?: number;
  yOff?: number;
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { cursor: "nw-resize", alignX: "left", alignY: "top" },
  { cursor: "n-resize", alignX: "center", alignY: "top" },
  { cursor: "ne-resize", alignX: "right", alignY: "top", xOff: 6 },
  { cursor: "w-resize", alignX: "left", alignY: "center" },
  { cursor: "e-resize", alignX: "right", alignY: "center", xOff: 6 },
  { cursor: "sw-resize", alignX: "left", alignY: "bottom", yOff: 6 },
  { cursor: "s-resize", alignX: "center", alignY: "bottom", yOff: 6 },
  { cursor: "se-resize", alignX: "right", alignY: "bottom", xOff: 6, yOff: 6 },
];

function handleStyle(h: ResizeHandle): React.CSSProperties {
  const s: React.CSSProperties = { cursor: h.cursor };
  const xOff = h.xOff || 0;
  const yOff = h.yOff || 0;
  if (h.alignX === "left") s.left = `${-6 + xOff}px`;
  else if (h.alignX === "right") s.right = `${-6 - xOff}px`;
  else s.left = `calc(50% - 6px + ${xOff}px)`;
  if (h.alignY === "top") s.top = `${-6 + yOff}px`;
  else if (h.alignY === "bottom") s.bottom = `${-6 - yOff}px`;
  else s.top = `calc(50% - 6px + ${yOff}px)`;
  return s;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function reassignIds(node: UiNode) {
  node.id = uuid();
  node.children.forEach(reassignIds);
}

export function UIEditorCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 订阅 store 状态（用于重新渲染）
  const renderVersion = useUiEditorStore((s) => s.renderVersion);
  const scale = useUiEditorStore((s) => s.scale);
  const panX = useUiEditorStore((s) => s.panX);
  const panY = useUiEditorStore((s) => s.panY);
  const selectedNodeId = useUiEditorStore((s) => s.selectedNodeId);
  const selectedNodeIds = useUiEditorStore((s) => s.selectedNodeIds);
  const activeRootId = useUiEditorStore((s) => s.activeRootId);
  const canvasWidth = useUiEditorStore((s) => s.canvasWidth);
  const canvasHeight = useUiEditorStore((s) => s.canvasHeight);

  // 本地 force-update（拖拽/缩放时实时刷新）
  const [, forceTick] = useReducer((x: number) => x + 1, 0);

  // 拖拽/平移状态（用 ref 避免频繁 re-render）
  const shiftKey = useRef(false);
  const ctrlKey = useRef(false);
  const ctrlHint = useRef({ show: false, type: "", x: 0, y: 0 });
  const dragState = useRef({
    isPanning: false,
    lastX: 0,
    lastY: 0,
    isDraggingNode: false,
    potentialDrag: false,
    nodeJustSelected: false,
    dragStartMouse: { x: 0, y: 0 },
    dragStartPositions: {} as Record<string, { x: number; y: number }>,
    isResizing: false,
    resizeHandle: null as ResizeHandle | null,
    resizeStartProps: null as any,
    resizeStartMouse: { x: 0, y: 0 },
  });
  // ctrlHint 的渲染状态
  const [, ctrlHintTick] = useReducer((x: number) => x + 1, 0);

  const store = useUiEditorStore;

  const isRootNode = useCallback(
    (id: string) => store.getState().getAllRootNodes().some((r) => r.id === id),
    [store]
  );

  // ============ 画布鼠标事件 ============
  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const ds = dragState.current;
      // 中键平移
      if (e.button === 1) {
        e.preventDefault();
        ds.isPanning = true;
        ds.lastX = e.clientX;
        ds.lastY = e.clientY;
        return;
      }
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target === canvasRef.current ||
        !target.closest("[data-node-id]")
      ) {
        ds.isPanning = true;
        ds.lastX = e.clientX;
        ds.lastY = e.clientY;
        if (!shiftKey.current) {
          store.getState().selectNode(null);
        }
      }
    },
    [store]
  );

  const onNodeMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      const ds = dragState.current;
      const st = store.getState();
      // 中键平移
      if (e.button === 1) {
        e.preventDefault();
        ds.isPanning = true;
        ds.lastX = e.clientX;
        ds.lastY = e.clientY;
        return;
      }
      if (e.button !== 0) return;

      // Ctrl+容器交互
      if (ctrlKey.current && st.selectedNodeIds.length === 1) {
        const sel = st.getSelectedNode();
        const rootNode = st.rootNode;
        if (sel && sel.type === "container" && nodeId !== sel.id && nodeId !== rootNode.id) {
          const targetNode = st.findNodeById(nodeId);
          if (targetNode) {
            const isChild = (parent: UiNode, cid: string): boolean => {
              for (const c of parent.children || []) {
                if (c.id === cid) return true;
                if (isChild(c, cid)) return true;
              }
              return false;
            };
            if (isChild(sel, nodeId)) {
              st.removeFromContainer(nodeId, sel.id);
            } else if (targetNode.type !== "container") {
              st.moveToContainer(nodeId, sel.id);
            }
          }
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      const selectedIds = st.selectedNodeIds;
      if (!selectedIds.includes(nodeId)) {
        if (shiftKey.current) st.toggleSelectNode(nodeId);
        else st.selectNode(nodeId);
        ds.nodeJustSelected = true;
      }
      // 根节点可选中但不能拖动
      if (isRootNode(nodeId)) {
        ds.potentialDrag = false;
        return;
      }
      ds.potentialDrag = true;
      ds.dragStartMouse = { x: e.clientX, y: e.clientY };
      ds.dragStartPositions = {};
      const currentIds = store.getState().selectedNodeIds;
      for (const id of currentIds) {
        const node = store.getState().findNodeById(id);
        if (node) {
          ds.dragStartPositions[id] = { x: node.props.x, y: node.props.y };
        }
      }
    },
    [store, isRootNode]
  );

  const onCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const ds = dragState.current;
      // Ctrl+容器交互提示
      updateCtrlHint(e);
      if (ds.isPanning) {
        const st = store.getState();
        st.setPan(st.panX + (e.clientX - ds.lastX), st.panY + (e.clientY - ds.lastY));
        ds.lastX = e.clientX;
        ds.lastY = e.clientY;
        return;
      }
      if (ds.isResizing) {
        handleResize(e);
        return;
      }
      if (ds.potentialDrag && !ds.isDraggingNode) {
        const dx = Math.abs(e.clientX - ds.dragStartMouse.x);
        const dy = Math.abs(e.clientY - ds.dragStartMouse.y);
        if (dx > 3 || dy > 3) {
          ds.isDraggingNode = true;
          store.getState().pushUndo();
        }
      }
      if (ds.isDraggingNode) {
        const s = store.getState().scale;
        const dx = (e.clientX - ds.dragStartMouse.x) / s;
        const dy = (e.clientY - ds.dragStartMouse.y) / s;
        for (const id of store.getState().selectedNodeIds) {
          const node = store.getState().findNodeById(id);
          const start = ds.dragStartPositions[id];
          if (node && start) {
            node.props.x = Math.round(start.x + dx);
            node.props.y = Math.round(start.y + dy);
          }
        }
        forceTick();
      }
    },
    [store]
  );

  const onCanvasMouseUp = useCallback(() => {
    const ds = dragState.current;
    const wasDragging = ds.isDraggingNode;
    ds.isPanning = false;
    ds.isDraggingNode = false;
    ds.potentialDrag = false;
    ds.isResizing = false;
    ds.dragStartPositions = {};
    if (wasDragging) ds.nodeJustSelected = true;
  }, []);

  const onSelectNode = useCallback(
    (nodeId: string) => {
      const ds = dragState.current;
      if (ds.nodeJustSelected) {
        ds.nodeJustSelected = false;
        return;
      }
      const st = store.getState();
      if (!isRootNode(nodeId)) {
        st.bringToFront(nodeId);
      }
      if (shiftKey.current) st.toggleSelectNode(nodeId);
      else st.selectNode(nodeId);
    },
    [store, isRootNode]
  );

  const onNodeEvent = useCallback(
    (id: string, type: string, payload?: any) => {
      if (type === "resize" && payload) {
        store.getState().updateNodeProps(id, { height: payload });
      }
    },
    [store]
  );

  // ============ Resize ============
  const startResize = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      const ds = dragState.current;
      ds.isResizing = true;
      ds.resizeHandle = handle;
      const sel = store.getState().getSelectedNode();
      ds.resizeStartProps = sel ? { ...sel.props } : null;
      ds.resizeStartMouse = { x: e.clientX, y: e.clientY };
    },
    [store]
  );

  const handleResize = useCallback(
    (e: React.MouseEvent) => {
      const ds = dragState.current;
      const sel = store.getState().getSelectedNode();
      if (!sel || !ds.resizeStartProps) return;
      const s = store.getState().scale;
      const dx = (e.clientX - ds.resizeStartMouse.x) / s;
      const dy = (e.clientY - ds.resizeStartMouse.y) / s;
      const p = ds.resizeStartProps;
      const newProps: any = {};
      const h = ds.resizeHandle!;
      if (h.alignY === "top") {
        newProps.y = Math.round(p.y + dy);
        newProps.height = Math.round(p.height - dy);
      } else if (h.alignY === "bottom") {
        newProps.height = Math.round(p.height + dy);
      }
      if (h.alignX === "left") {
        newProps.x = Math.round(p.x + dx);
        newProps.width = Math.round(p.width - dx);
      } else if (h.alignX === "right") {
        newProps.width = Math.round(p.width + dx);
      }
      if (newProps.width && newProps.width < 10) newProps.width = 10;
      if (newProps.height && newProps.height < 10) newProps.height = 10;
      // 直接 mutate + forceTick（避免频繁 pushUndo）
      Object.assign(sel.props, newProps);
      forceTick();
    },
    [store]
  );

  // ============ 滚轮缩放 ============
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const st = store.getState();
      const oldScale = st.scale;
      const newScale = Math.max(0.1, Math.min(3, oldScale + delta));
      if (newScale === oldScale) return;
      const canvasX = (mouseX - st.panX) / oldScale;
      const canvasY = (mouseY - st.panY) / oldScale;
      st.setPan(mouseX - canvasX * newScale, mouseY - canvasY * newScale);
      st.setScale(newScale);
    },
    [store]
  );

  // ============ 键盘 ============
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Shift") shiftKey.current = true;
    if (e.key === "Control") ctrlKey.current = true;

    // 判断焦点是否在输入元素中（输入框内不触发快捷键，Shift/Ctrl 仍正常记录）
    const target = e.target as HTMLElement | null;
    const isEditable =
      !!target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable);

    // Ctrl+Z 撤销 / Ctrl+Shift+Z 或 Ctrl+Y 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z" || e.key === "y" || e.key === "Y")) {
      if (isEditable) return;
      e.preventDefault();
      const st = store.getState();
      if (e.key.toLowerCase() === "y" || e.shiftKey) {
        st.redo();
      } else {
        st.undo();
      }
      return;
    }

    // Delete / Backspace 删除选中控件
    if ((e.key === "Delete" || e.key === "Backspace") && !isEditable) {
      const st = store.getState();
      if (st.selectedNodeIds.length > 0) {
        e.preventDefault();
        st.deleteSelectedNodes();
      }
    }

    // Q 键锁定/解锁选中控件
    if ((e.key === "q" || e.key === "Q") && !isEditable) {
      const st = store.getState();
      const ids = st.selectedNodeIds.filter((id) => !st.getAllRootNodes().some((r) => r.id === id));
      if (ids.length > 0) {
        e.preventDefault();
        const allLocked = ids.every((id) => st.findNodeById(id)?.props.locked);
        st.updateMultipleNodesProps(ids, { locked: !allLocked });
      }
    }
  }, [store]);
  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === "Shift") shiftKey.current = false;
    if (e.key === "Control") {
      ctrlKey.current = false;
      ctrlHint.current.show = false;
      ctrlHintTick();
    }
  }, [ctrlHintTick]);

  // ============ Ctrl+容器交互提示 ============
  const updateCtrlHint = useCallback(
    (e: React.MouseEvent) => {
      const ch = ctrlHint.current;
      if (!ctrlKey.current || dragState.current.isPanning || dragState.current.isDraggingNode || dragState.current.isResizing) {
        if (ch.show) {
          ch.show = false;
          ctrlHintTick();
        }
        return;
      }
      const st = store.getState();
      if (st.selectedNodeIds.length !== 1) {
        if (ch.show) {
          ch.show = false;
          ctrlHintTick();
        }
        return;
      }
      const sel = st.getSelectedNode();
      if (!sel || sel.type !== "container") {
        if (ch.show) {
          ch.show = false;
          ctrlHintTick();
        }
        return;
      }
      const el = (e.target as HTMLElement).closest("[data-node-id]") as HTMLElement | null;
      if (!el) {
        if (ch.show) {
          ch.show = false;
          ctrlHintTick();
        }
        return;
      }
      const hoverId = el.dataset.nodeId;
      if (!hoverId || hoverId === sel.id || hoverId === st.rootNode.id) {
        if (ch.show) {
          ch.show = false;
          ctrlHintTick();
        }
        return;
      }
      const hoverNode = st.findNodeById(hoverId);
      if (!hoverNode) {
        if (ch.show) {
          ch.show = false;
          ctrlHintTick();
        }
        return;
      }
      const isChild = (parent: UiNode, cid: string): boolean => {
        for (const c of parent.children || []) {
          if (c.id === cid) return true;
          if (isChild(c, cid)) return true;
        }
        return false;
      };
      let changed = false;
      if (isChild(sel, hoverId)) {
        ch.type = "remove";
        if (!ch.show) changed = true;
        ch.show = true;
        ch.x = e.clientX;
        ch.y = e.clientY;
        changed = true;
      } else if (hoverNode.type !== "container") {
        ch.type = "add";
        ch.show = true;
        ch.x = e.clientX;
        ch.y = e.clientY;
        changed = true;
      } else {
        if (ch.show) {
          ch.show = false;
          changed = true;
        }
      }
      if (changed) ctrlHintTick();
    },
    [store, ctrlHintTick]
  );

  // ============ 拖拽放置 ============
  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const canvasArea = canvasRef.current?.querySelector(".canvas-area") as HTMLElement | null;
      if (!canvasArea) return;
      const areaRect = canvasArea.getBoundingClientRect();
      const s = store.getState().scale;
      const canvasX = Math.round((e.clientX - areaRect.left) / s);
      const canvasY = Math.round((e.clientY - areaRect.top) / s);

      // 找到 drop 位置的根节点
      const st = store.getState();
      const roots = st.getAllRootNodes();
      let targetRoot = roots[roots.length - 1];
      let offX = 0;
      for (const root of roots) {
        const rootEnd = offX + root.props.width;
        if (canvasX >= offX && canvasX <= rootEnd) {
          targetRoot = root;
          break;
        }
        offX = rootEnd + ROOT_GAP;
      }
      st.setEditorActive(true); // ensure active
      // 激活目标根节点
      useUiEditorStore.setState({ activeRootId: targetRoot.id });

      // 检测目标图片控件
      const targetNodeEl = (e.target as HTMLElement).closest("[data-node-id]") as HTMLElement | null;
      const targetNodeId = targetNodeEl?.dataset.nodeId;
      const targetNode = targetNodeId ? st.findNodeById(targetNodeId) : null;
      const isImageTarget = targetNode && targetNode.type === "image";

      const x = Math.max(0, canvasX - 50);
      const y = Math.max(0, canvasY - 50);

      // 1) 素材库图片（text/asset 通道 或 application/x-asset）
      const assetJson =
        e.dataTransfer.getData("text/asset") ||
        e.dataTransfer.getData("application/x-asset");
      if (assetJson) {
        try {
          const item = JSON.parse(assetJson);
          if (item._kind === "asset" && item.id) {
            dropAsset(String(item.id), x, y, isImageTarget ? targetNode : null);
            return;
          }
        } catch {}
      }
      // asset: 通道（纯文本）
      const textData = e.dataTransfer.getData("text/plain");
      if (textData && textData.startsWith("asset:")) {
        const assetId = textData.substring(6);
        dropAsset(assetId, x, y, isImageTarget ? targetNode : null);
        return;
      }

      // 2) 外部图片文件
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type && file.type.startsWith("image/")) {
          try {
            const created = await api.uploadImage(file);
            if (created && created.id) {
              const st2 = store.getState();
              if (isImageTarget && targetNode) {
                st2.updateNodeProps(targetNode.id, { assetId: String(created.id) });
              } else {
                st2.addWidget("image", undefined, x, y);
                const activeRoot = store.getState().getActiveRoot();
                const lastChild = activeRoot.children[activeRoot.children.length - 1];
                if (lastChild) {
                  store.getState().updateNodeProps(lastChild.id, { assetId: String(created.id) });
                }
              }
            }
          } catch (err) {
            console.error("拖入外部图片失败:", err);
          }
          return;
        }
      }

      // 3) widget:/template: 通道
      if (!textData) return;
      if (textData.startsWith("widget:")) {
        const type = textData.substring(7) as WidgetType;
        store.getState().addWidget(type, undefined, x, y);
      } else if (textData.startsWith("template:")) {
        const tplId = parseInt(textData.substring(9));
        const tplStore = useUiTemplateStore.getState();
        const tpl = tplStore.templates.find((t) => t.id === tplId);
        if (tpl) {
          try {
            const nodeData =
              typeof tpl.node_data === "string" ? JSON.parse(tpl.node_data) : tpl.node_data;
            const cloned: UiNode = JSON.parse(JSON.stringify(nodeData));
            reassignIds(cloned);
            const st3 = store.getState();
            const activeRoot = st3.getActiveRoot();
            const rootOffsetX = st3.getRootOffsetX(activeRoot.id);
            cloned.props.x = x - rootOffsetX;
            cloned.props.y = y;
            cloned.name = tpl.name;
            st3.pushUndo();
            activeRoot.children.push(cloned);
            st3.selectNode(cloned.id);
            useUiEditorStore.setState({ isModified: true });
          } catch (err) {
            console.error("Failed to drop template:", err);
          }
        }
      }
    },
    [store]
  );

  const dropAsset = useCallback(
    (assetId: string, x: number, y: number, targetNode: UiNode | null) => {
      const st = store.getState();
      if (targetNode) {
        st.updateNodeProps(targetNode.id, { assetId });
      } else {
        st.addWidget("image", undefined, x, y);
        const activeRoot = store.getState().getActiveRoot();
        const lastChild = activeRoot.children[activeRoot.children.length - 1];
        if (lastChild) {
          store.getState().updateNodeProps(lastChild.id, { assetId });
        }
      }
    },
    [store]
  );

  // ============ 生命周期 ============
  useEffect(() => {
    const el = canvasRef.current;
    if (el) {
      el.addEventListener("wheel", handleWheel, { passive: false });
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
    }
    return () => {
      if (el) el.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [handleWheel, onKeyDown, onKeyUp]);

  // ============ 计算样式 ============
  const st = store.getState();
  const allRoots = st.getAllRootNodes();
  let totalWidth = 0;
  let maxHeight = canvasHeight;
  for (let i = 0; i < allRoots.length; i++) {
    totalWidth += allRoots[i].props.width;
    if (i > 0) totalWidth += ROOT_GAP;
    if (allRoots[i].props.height > maxHeight) maxHeight = allRoots[i].props.height;
  }
  if (totalWidth < canvasWidth) totalWidth = canvasWidth;

  const getSelectionStyle = (nid: string): React.CSSProperties => {
    const node = st.findNodeById(nid);
    if (!node) return { display: "none" };
    const abs = st.getAbsolutePosition(nid);
    return {
      left: `${abs.x}px`,
      top: `${abs.y}px`,
      width: `${node.props.width}px`,
      height: `${node.props.height}px`,
    };
  };

  const ch = ctrlHint.current;

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 w-full h-full overflow-hidden select-none"
      style={{ background: "#1a1a1a" }}
      onMouseDown={onCanvasMouseDown}
      onMouseMove={onCanvasMouseMove}
      onMouseUp={onCanvasMouseUp}
      onMouseLeave={onCanvasMouseUp}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* 网格背景 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
        }}
      />

      {/* 画布内容 */}
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          className="canvas-area relative"
          style={{
            width: `${totalWidth}px`,
            height: `${maxHeight}px`,
            background: "#0f0f0f",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* 多根节点并排渲染 */}
          {allRoots.map((root) => {
            const offsetX = st.getRootOffsetX(root.id);
            const isActive = activeRootId === root.id;
            const isSelected = selectedNodeId === root.id;
            const outline = isActive
              ? "2px dashed rgba(96,165,250,0.4)"
              : isSelected
              ? "2px solid #60a5fa"
              : "none";
            return (
              <div
                key={root.id}
                className="absolute top-0"
                style={{
                  left: `${offsetX}px`,
                  top: "0px",
                  width: `${root.props.width}px`,
                  height: `${root.props.height}px`,
                  outline,
                  outlineOffset: "-2px",
                }}
              >
                <UIRenderer
                  key={`render-${root.id}-${renderVersion}`}
                  nodes={[root]}
                  isEditor={true}
                  onSelect={onSelectNode}
                  onMouseDownNode={onNodeMouseDown}
                  onEvent={onNodeEvent}
                />
                {/* 根节点标签 */}
                <div
                  className="absolute flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] whitespace-nowrap z-10 cursor-pointer"
                  style={{
                    top: "-28px",
                    left: "0",
                    background: "#1f1f1f",
                    border: `1px solid ${isActive ? "rgba(96,165,250,0.6)" : "#333"}`,
                    borderRadius: "4px",
                    color: isActive ? "#60a5fa" : "#ccc",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    store.getState().selectNode(root.id);
                  }}
                >
                  <span className="font-medium">{root.name}</span>
                  {allRoots.length > 1 && (
                    <span
                      className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px]"
                      style={{ background: "#333", color: "#999" }}
                    >
                      {allRoots.findIndex((r) => r.id === root.id) + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* 选中框 */}
          {selectedNodeIds.map((nid) => {
            if (isRootNode(nid)) return null;
            const node = st.findNodeById(nid);
            if (!node) return null;
            const isPrimary = nid === selectedNodeId;
            return (
              <div
                key={`sel-${nid}-${renderVersion}`}
                className="absolute pointer-events-none box-border"
                style={{
                  ...getSelectionStyle(nid),
                  border: isPrimary ? "2px solid #60a5fa" : "1px solid rgba(96,165,250,0.5)",
                }}
              >
                {isPrimary &&
                  RESIZE_HANDLES.map((h, idx) => (
                    <div
                      key={idx}
                      className="absolute w-2.5 h-2.5 bg-white rounded-sm pointer-events-auto box-border"
                      style={{
                        ...handleStyle(h),
                        border: "2px solid #3b82f6",
                      }}
                      onMouseDown={(e) => startResize(e, h)}
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 缩放和坐标信息 */}
      <div
        className="absolute bottom-2 right-2 flex items-center gap-2 px-2 py-1 rounded text-[11px] text-white pointer-events-none"
        style={{ background: "rgba(0,0,0,0.7)" }}
      >
        <span>{Math.round(scale * 100)}%</span>
        <span>
          {Math.round(panX)}, {Math.round(panY)}
        </span>
      </div>

      {/* Ctrl+容器交互提示 */}
      {ch.show && (
        <div
          className="fixed z-[9999] pointer-events-none w-[22px] h-[22px] rounded-full flex items-center justify-center text-[18px] font-bold text-white"
          style={{
            left: ch.x,
            top: ch.y,
            transform: "translate(10px, 10px)",
            background: ch.type === "remove" ? "#ef4444" : "#22c55e",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            border: "2px solid rgba(255,255,255,0.9)",
          }}
        >
          {ch.type === "remove" ? "−" : "+"}
        </div>
      )}
    </div>
  );
}
