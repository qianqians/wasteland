// UI 编辑器 Store（Zustand）：移植自参考项目 Pinia 版本
// 节点树结构：root（页面根） + image/text/container/button/progress 控件
import { create } from "zustand";
import { schemeApi } from "@/lib/uiApi";

// ============ 常量 ============
export const CANVAS_PRESETS = [
  { label: "手机 - iPhone 15 Pro", width: 393, height: 852 },
  { label: "手机 - iPhone 14", width: 390, height: 844 },
  { label: "手机 - Android 标准", width: 360, height: 800 },
  { label: "手机 - iPhone SE", width: 375, height: 667 },
  { label: "平板 - iPad", width: 768, height: 1024 },
  { label: "PC - 1080P", width: 1920, height: 1080 },
  { label: "PC - 2K", width: 2560, height: 1440 },
  { label: "PC - 4K", width: 3840, height: 2160 },
];

// 根节点之间的水平间距
export const ROOT_GAP = 80;
// 控件默认 Z-Index
export const DEFAULT_Z_INDEX = 20;

// ============ Types ============
export type WidgetType = "image" | "text" | "container" | "button" | "progress";

export interface NodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  locked: boolean;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  backgroundColor?: string;
  // image
  assetId?: string | number;
  fillMode?: "contain" | "cover" | "fill" | "repeat-x" | "repeat-y" | "repeat";
  nineSliceEnabled?: boolean;
  sliceLeft?: number;
  sliceRight?: number;
  sliceTop?: number;
  sliceBottom?: number;
  tileWidth?: number;
  tileHeight?: number;
  // root - 背景图片
  rootBgAssetId?: string | number;
  rootBgFillMode?: "contain" | "cover" | "fill" | "repeat-x" | "repeat-y" | "repeat";
  rootBgTileWidth?: number;
  rootBgTileHeight?: number;
  // text
  content?: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  // container
  clip?: boolean;
  // button
  normalAssetId?: string | number;
  hoverAssetId?: string | number;
  pressedAssetId?: string | number;
  disabledAssetId?: string | number;
  disabled?: boolean;
  // progress
  bgAssetId?: string | number;
  fillAssetId?: string | number;
  currentValue?: number;
  maxValue?: number;
  fillDirection?: "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top";
}

export interface UiEvent {
  trigger: "click" | "mouseEnter" | "mouseLeave" | "mounted";
  action: { type: string; targetId?: string };
}

export interface UiNode {
  id: string;
  type: "root" | WidgetType;
  name: string;
  isRoot?: boolean;
  isPageRoot?: boolean;
  props: NodeProps;
  children: UiNode[];
  events: UiEvent[];
}

interface AlignType {
  type: "left" | "center" | "right" | "top" | "middle" | "bottom";
}
type DistributeType = "distributeHorizontal" | "distributeVertical";

// ============ 工厂 ============
function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getDefaultName(type: WidgetType): string {
  const names: Record<WidgetType, string> = {
    image: "图片",
    text: "文本",
    container: "容器",
    button: "按钮",
    progress: "进度条",
  };
  return names[type] || type;
}

export function createRootNode(canvasWidth: number, canvasHeight: number, name?: string): UiNode {
  return {
    id: uuid(),
    type: "root",
    name: name || "根节点",
    isRoot: true,
    isPageRoot: true,
    props: {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      visible: true,
      locked: false,
      backgroundColor: "#4d4d4d",
      zIndex: 0,
    },
    children: [],
    events: [],
  };
}

export function createWidget(type: WidgetType, overrides?: Partial<UiNode>): UiNode {
  const base: UiNode = {
    id: uuid(),
    type,
    name: getDefaultName(type),
    props: {
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      visible: true,
      locked: false,
      rotation: 0,
      opacity: 1,
      zIndex: DEFAULT_Z_INDEX,
    },
    children: [],
    events: [],
  };
  switch (type) {
    case "image":
      base.props.assetId = "";
      base.props.fillMode = "contain";
      base.props.nineSliceEnabled = false;
      base.props.sliceLeft = 0;
      base.props.sliceRight = 0;
      base.props.sliceTop = 0;
      base.props.sliceBottom = 0;
      base.props.tileWidth = 100;
      base.props.tileHeight = 100;
      break;
    case "text":
      base.props.content = "文本";
      base.props.fontSize = 24;
      base.props.color = "#ffffff";
      base.props.fontFamily = "sans-serif";
      base.props.textAlign = "left";
      base.props.lineHeight = 1.5;
      base.props.strokeColor = "";
      base.props.strokeWidth = 0;
      base.props.height = 40;
      break;
    case "container":
      base.props.clip = false;
      base.props.backgroundColor = "#aed0ea";
      base.props.opacity = 0.4;
      break;
    case "button":
      base.props.normalAssetId = "";
      base.props.hoverAssetId = "";
      base.props.pressedAssetId = "";
      base.props.disabledAssetId = "";
      base.props.disabled = false;
      break;
    case "progress":
      base.props.bgAssetId = "";
      base.props.fillAssetId = "";
      base.props.currentValue = 50;
      base.props.maxValue = 100;
      base.props.fillDirection = "left-to-right";
      break;
  }
  if (overrides) {
    Object.assign(base, overrides);
    if (overrides.props) Object.assign(base.props, overrides.props);
  }
  return base;
}

// ============ 递归工具 ============
function findNode(node: UiNode, id: string): UiNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function findParent(node: UiNode, targetId: string): UiNode | null {
  for (const child of node.children) {
    if (child.id === targetId) return node;
    const found = findParent(child, targetId);
    if (found) return found;
  }
  return null;
}

function isDescendant(parent: UiNode, targetId: string): boolean {
  for (const child of parent.children) {
    if (child.id === targetId) return true;
    if (isDescendant(child, targetId)) return true;
  }
  return false;
}

function removeNodeById(node: UiNode, id: string): boolean {
  const idx = node.children.findIndex((c) => c.id === id);
  if (idx !== -1) {
    node.children.splice(idx, 1);
    return true;
  }
  for (const child of node.children) {
    if (removeNodeById(child, id)) return true;
  }
  return false;
}

function sanitizeZIndex(node: UiNode) {
  if (!node || !node.props) return;
  if (node.type !== "root" && node.props.zIndex != null && node.props.zIndex < 0) {
    node.props.zIndex = 0;
  }
  for (const child of node.children) sanitizeZIndex(child);
}

function flattenNodes(node: UiNode, result: UiNode[]) {
  result.push(node);
  for (const child of node.children) flattenNodes(child, result);
}

// ============ Store ============
interface UiEditorState {
  currentSchemeId: number | null;
  schemeName: string;
  schemeDescription: string;
  canvasWidth: number;
  canvasHeight: number;
  rootNode: UiNode;
  extraRootNodes: UiNode[];
  activeRootId: string;
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  scale: number;
  panX: number;
  panY: number;
  isSaving: boolean;
  isModified: boolean;
  renderVersion: number;
  undoStack: string[];
  redoStack: string[];
  rightPanelTab: "filter" | "properties";
  isEditorActive: boolean;

  // computed-like getters
  getAllRootNodes: () => UiNode[];
  getActiveRoot: () => UiNode;
  getRootOffsetX: (rootId: string) => number;
  findNodeById: (id: string) => UiNode | null;
  findParentById: (id: string) => UiNode | null;
  findRootOf: (nodeId: string) => UiNode | null;
  getAbsolutePosition: (id: string) => { x: number; y: number };
  getSelectedNode: () => UiNode | null;
  getFlatNodes: () => UiNode[];

  // actions
  selectNode: (id: string | null) => void;
  toggleSelectNode: (id: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  addWidget: (type: WidgetType, parentId?: string | null, x?: number, y?: number) => void;
  updateNodeProps: (id: string, props: Partial<NodeProps>) => void;
  updateMultipleNodesProps: (ids: string[], props: Partial<NodeProps>) => void;
  moveNodes: (ids: string[], dx: number, dy: number) => void;
  updateNodeName: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  moveNode: (id: string, newParentId: string, index?: number) => void;
  reorderNode: (parentId: string, fromIndex: number, toIndex: number) => void;
  setLayer: (id: string, action: "top" | "bottom" | "up" | "down") => void;
  bringToFront: (id: string) => void;
  moveToContainer: (nodeId: string, containerId: string) => void;
  removeFromContainer: (childId: string, containerId: string) => void;
  alignNodes: (ids: string[], alignType: AlignType["type"]) => void;
  distributeNodes: (ids: string[], type: DistributeType) => void;
  addEvent: (nodeId: string, event: UiEvent) => void;
  updateEvent: (nodeId: string, eventIndex: number, event: UiEvent) => void;
  removeEvent: (nodeId: string, eventIndex: number) => void;
  addRootNode: (name?: string) => UiNode;
  deleteRootNode: (rootId: string) => boolean;
  setCanvasSize: (width: number, height: number) => void;
  setScale: (scale: number) => void;
  setPan: (x: number, y: number) => void;
  setRightPanelTab: (tab: "filter" | "properties") => void;
  setEditorActive: (active: boolean) => void;

  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  saveScheme: () => Promise<void>;
  autosave: () => Promise<void>;
  loadScheme: (id: number) => Promise<void>;
  newScheme: () => void;
  exitEditor: () => void;
}

export const useUiEditorStore = create<UiEditorState>((set, get) => {
  const initialRoot = createRootNode(1920, 1080);

  // 快照所有根节点
  const snapshot = (): string =>
    JSON.stringify({
      rootNode: get().rootNode,
      extraRootNodes: get().extraRootNodes,
    });

  const restore = (snap: string) => {
    const data = JSON.parse(snap);
    // 递增 renderVersion 触发 UIEditorCanvas 重渲染，避免撤销/重做后编辑区不刷新
    set((state) => ({
      rootNode: data.rootNode,
      extraRootNodes: data.extraRootNodes || [],
      isModified: true,
      renderVersion: state.renderVersion + 1,
    }));
  };

  return {
    currentSchemeId: null,
    schemeName: "未命名方案",
    schemeDescription: "",
    canvasWidth: 1920,
    canvasHeight: 1080,
    rootNode: initialRoot,
    extraRootNodes: [],
    activeRootId: initialRoot.id,
    selectedNodeId: null,
    selectedNodeIds: [],
    scale: 0.5,
    panX: 0,
    panY: 0,
    isSaving: false,
    isModified: false,
    renderVersion: 0,
    undoStack: [],
    redoStack: [],
    rightPanelTab: "filter",
    isEditorActive: false,

    getAllRootNodes: () => [get().rootNode, ...get().extraRootNodes],

    getActiveRoot: () => {
      const { activeRootId, rootNode, extraRootNodes, selectedNodeId } = get();
      if (activeRootId) {
        const root = [rootNode, ...extraRootNodes].find((r) => r.id === activeRootId);
        if (root) return root;
      }
      if (selectedNodeId) {
        const root = get().findRootOf(selectedNodeId);
        if (root) return root;
      }
      return rootNode;
    },

    getRootOffsetX: (rootId: string) => {
      const roots = get().getAllRootNodes();
      let offsetX = 0;
      for (const root of roots) {
        if (root.id === rootId) return offsetX;
        offsetX += root.props.width + ROOT_GAP;
      }
      return 0;
    },

    findNodeById: (id: string) => {
      for (const root of get().getAllRootNodes()) {
        const found = findNode(root, id);
        if (found) return found;
      }
      return null;
    },

    findParentById: (id: string) => {
      for (const root of get().getAllRootNodes()) {
        const found = findParent(root, id);
        if (found) return found;
      }
      return null;
    },

    findRootOf: (nodeId: string) => {
      for (const root of get().getAllRootNodes()) {
        if (root.id === nodeId) return root;
        if (isDescendant(root, nodeId)) return root;
      }
      return null;
    },

    getAbsolutePosition: (id: string) => {
      let x = 0,
        y = 0;
      let current = get().findNodeById(id);
      if (!current) return { x: 0, y: 0 };
      const root = get().findRootOf(id);
      if (root) x += get().getRootOffsetX(root.id);
      while (current && current.id !== root?.id) {
        x += current.props.x;
        y += current.props.y;
        const parent = get().findParentById(current.id);
        current = parent;
      }
      return { x, y };
    },

    getSelectedNode: () => {
      const id = get().selectedNodeId;
      if (!id) return null;
      return get().findNodeById(id);
    },

    getFlatNodes: () => {
      const result: UiNode[] = [];
      for (const root of get().getAllRootNodes()) flattenNodes(root, result);
      return result;
    },

    selectNode: (id) =>
      set((state) => {
        if (id) {
          const root = get().findRootOf(id);
          return {
            selectedNodeId: id,
            selectedNodeIds: [id],
            rightPanelTab: "properties",
            activeRootId: root ? root.id : state.activeRootId,
          };
        }
        return { selectedNodeId: null, selectedNodeIds: [] };
      }),

    toggleSelectNode: (id) =>
      set((state) => {
        const idx = state.selectedNodeIds.indexOf(id);
        const next = [...state.selectedNodeIds];
        if (idx === -1) next.push(id);
        else next.splice(idx, 1);
        const nextSelected = next.length > 0 ? next[next.length - 1] : null;
        let activeRootId = state.activeRootId;
        if (nextSelected) {
          const root = get().findRootOf(nextSelected);
          if (root) activeRootId = root.id;
        }
        return {
          selectedNodeIds: next,
          selectedNodeId: nextSelected,
          rightPanelTab: nextSelected ? "properties" : state.rightPanelTab,
          activeRootId,
        };
      }),

    setSelectedNodeIds: (ids) =>
      set({
        selectedNodeIds: ids,
        selectedNodeId: ids.length > 0 ? ids[ids.length - 1] : null,
      }),

    addWidget: (type, parentId, x, y) => {
      get().pushUndo();
      const widget = createWidget(type);
      let parent: UiNode | null = null;
      if (parentId) parent = get().findNodeById(parentId);
      else parent = get().getActiveRoot();
      if (parent) {
        const root = get().findRootOf(parent.id) || parent;
        const rootOffsetX = get().getRootOffsetX(root.id);
        if (x !== undefined && y !== undefined) {
          widget.props.x = x - rootOffsetX;
          widget.props.y = y;
        } else {
          // 默认放在父节点中央偏下，避免被左侧浮动控件栏遮挡；多个控件错开排列
          const offset = parent.children.length * 30;
          widget.props.x = Math.floor((parent.props.width - widget.props.width) / 2) + offset;
          widget.props.y = Math.floor((parent.props.height - widget.props.height) / 2) + offset;
        }
        parent.children.push(widget);
        set((state) => ({
          isModified: true,
          rightPanelTab: "properties",
          selectedNodeId: widget.id,
          selectedNodeIds: [widget.id],
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    updateNodeProps: (id, props) => {
      get().pushUndo();
      const node = get().findNodeById(id);
      if (node) {
        let safeProps = props;
        if (node.type !== "root" && props.zIndex != null && props.zIndex < 0) {
          safeProps = { ...props, zIndex: 0 };
        }
        Object.assign(node.props, safeProps);
        set((state) => ({
          isModified: true,
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    updateMultipleNodesProps: (ids, props) => {
      get().pushUndo();
      let safeProps = props;
      if (props.zIndex != null && props.zIndex < 0) {
        safeProps = { ...props, zIndex: 0 };
      }
      for (const id of ids) {
        const node = get().findNodeById(id);
        if (node) Object.assign(node.props, safeProps);
      }
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    moveNodes: (ids, dx, dy) => {
      get().pushUndo();
      for (const id of ids) {
        const node = get().findNodeById(id);
        if (node) {
          node.props.x += dx;
          node.props.y += dy;
        }
      }
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    updateNodeName: (id, name) => {
      const node = get().findNodeById(id);
      if (node) {
        node.name = name;
        set((state) => ({
          isModified: true,
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    deleteNode: (id) => {
      const { rootNode, extraRootNodes } = get();
      if (id === rootNode.id) return;
      if (extraRootNodes.some((r) => r.id === id)) {
        get().deleteRootNode(id);
        return;
      }
      get().pushUndo();
      for (const root of get().getAllRootNodes()) {
        if (removeNodeById(root, id)) break;
      }
      set((state) => ({
        isModified: true,
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
        selectedNodeIds: state.selectedNodeIds.filter((nid) => nid !== id),
        renderVersion: state.renderVersion + 1,
      }));
    },

    deleteSelectedNodes: () => {
      const { selectedNodeIds, rootNode, extraRootNodes } = get();
      if (selectedNodeIds.length === 0) return;
      get().pushUndo();
      for (const id of [...selectedNodeIds]) {
        if (id === rootNode.id) continue;
        if (extraRootNodes.some((r) => r.id === id)) {
          get().deleteRootNode(id);
          continue;
        }
        for (const root of get().getAllRootNodes()) {
          if (removeNodeById(root, id)) break;
        }
      }
      set({
        selectedNodeId: null,
        selectedNodeIds: [],
        isModified: true,
        renderVersion: get().renderVersion + 1,
      });
    },

    moveNode: (id, newParentId, index) => {
      get().pushUndo();
      const node = get().findNodeById(id);
      if (!node) return;
      for (const root of get().getAllRootNodes()) {
        if (removeNodeById(root, id)) break;
      }
      const newParent = get().findNodeById(newParentId);
      if (newParent) {
        if (index !== undefined) newParent.children.splice(index, 0, node);
        else newParent.children.push(node);
        set((state) => ({
          isModified: true,
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    reorderNode: (parentId, fromIndex, toIndex) => {
      get().pushUndo();
      const parent = get().findNodeById(parentId);
      if (parent) {
        const [moved] = parent.children.splice(fromIndex, 1);
        parent.children.splice(toIndex, 0, moved);
        set((state) => ({
          isModified: true,
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    setLayer: (id, action) => {
      get().pushUndo();
      const parent = get().findParentById(id);
      if (!parent) return;
      const idx = parent.children.findIndex((c) => c.id === id);
      if (idx === -1) return;
      const [item] = parent.children.splice(idx, 1);
      switch (action) {
        case "top":
          parent.children.push(item);
          break;
        case "bottom":
          parent.children.unshift(item);
          break;
        case "up":
          parent.children.splice(Math.min(idx + 1, parent.children.length), 0, item);
          break;
        case "down":
          parent.children.splice(Math.max(idx - 1, 0), 0, item);
          break;
      }
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    bringToFront: (id) => {
      const parent = get().findParentById(id);
      if (!parent) return;
      const idx = parent.children.findIndex((c) => c.id === id);
      if (idx === -1 || idx === parent.children.length - 1) return;
      const [item] = parent.children.splice(idx, 1);
      parent.children.push(item);
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    moveToContainer: (nodeId, containerId) => {
      get().pushUndo();
      const node = get().findNodeById(nodeId);
      const container = get().findNodeById(containerId);
      if (!node || !container || nodeId === containerId) return;
      if (isDescendant(container, nodeId)) return;
      const nodeAbs = get().getAbsolutePosition(nodeId);
      const containerAbs = get().getAbsolutePosition(containerId);
      node.props.x = nodeAbs.x - containerAbs.x;
      node.props.y = nodeAbs.y - containerAbs.y;
      for (const root of get().getAllRootNodes()) {
        if (removeNodeById(root, nodeId)) break;
      }
      container.children.push(node);
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    removeFromContainer: (childId, containerId) => {
      get().pushUndo();
      const container = get().findNodeById(containerId);
      const child = get().findNodeById(childId);
      if (!container || !child) return;
      const idx = container.children.findIndex((c) => c.id === childId);
      if (idx === -1) return;
      container.children.splice(idx, 1);
      const containerAbs = get().getAbsolutePosition(containerId);
      const root = get().findRootOf(containerId);
      const rootOffsetX = root ? get().getRootOffsetX(root.id) : 0;
      child.props.x = child.props.x + (containerAbs.x - rootOffsetX);
      child.props.y = child.props.y + containerAbs.y;
      if (root) root.children.push(child);
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    alignNodes: (ids, alignType) => {
      if (ids.length < 2) return;
      get().pushUndo();
      const nodes = ids.map((id) => get().findNodeById(id)).filter(Boolean) as UiNode[];
      if (nodes.length < 2) return;
      const ref = nodes[0];
      switch (alignType) {
        case "left":
          nodes.forEach((n) => (n.props.x = ref.props.x));
          break;
        case "center":
          nodes.forEach((n) => (n.props.x = ref.props.x + ref.props.width / 2 - n.props.width / 2));
          break;
        case "right":
          nodes.forEach((n) => (n.props.x = ref.props.x + ref.props.width - n.props.width));
          break;
        case "top":
          nodes.forEach((n) => (n.props.y = ref.props.y));
          break;
        case "middle":
          nodes.forEach((n) => (n.props.y = ref.props.y + ref.props.height / 2 - n.props.height / 2));
          break;
        case "bottom":
          nodes.forEach((n) => (n.props.y = ref.props.y + ref.props.height - n.props.height));
          break;
      }
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    distributeNodes: (ids, type) => {
      if (ids.length < 3) return;
      get().pushUndo();
      const nodes = ids.map((id) => get().findNodeById(id)).filter(Boolean) as UiNode[];
      if (nodes.length < 3) return;
      if (type === "distributeHorizontal") {
        nodes.sort((a, b) => a.props.x - b.props.x);
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const totalWidth = nodes.reduce((s, n) => s + (n.props.width || 0), 0);
        const totalSpace = last.props.x + last.props.width - first.props.x - totalWidth;
        const gap = totalSpace / (nodes.length - 1);
        let currentX = first.props.x + first.props.width;
        for (let i = 1; i < nodes.length - 1; i++) {
          nodes[i].props.x = Math.round(currentX + gap);
          currentX = nodes[i].props.x + nodes[i].props.width;
        }
      } else {
        nodes.sort((a, b) => a.props.y - b.props.y);
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const totalHeight = nodes.reduce((s, n) => s + (n.props.height || 0), 0);
        const totalSpace = last.props.y + last.props.height - first.props.y - totalHeight;
        const gap = totalSpace / (nodes.length - 1);
        let currentY = first.props.y + first.props.height;
        for (let i = 1; i < nodes.length - 1; i++) {
          nodes[i].props.y = Math.round(currentY + gap);
          currentY = nodes[i].props.y + nodes[i].props.height;
        }
      }
      set((state) => ({
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    addEvent: (nodeId, event) => {
      get().pushUndo();
      const node = get().findNodeById(nodeId);
      if (node) {
        node.events.push(event);
        set((state) => ({
          isModified: true,
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    updateEvent: (nodeId, eventIndex, event) => {
      get().pushUndo();
      const node = get().findNodeById(nodeId);
      if (node && node.events[eventIndex]) {
        node.events[eventIndex] = event;
        set((state) => ({
          isModified: true,
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    removeEvent: (nodeId, eventIndex) => {
      get().pushUndo();
      const node = get().findNodeById(nodeId);
      if (node) {
        node.events.splice(eventIndex, 1);
        set((state) => ({
          isModified: true,
          renderVersion: state.renderVersion + 1,
        }));
      }
    },

    addRootNode: (name) => {
      get().pushUndo();
      const root = createRootNode(get().canvasWidth, get().canvasHeight, name);
      set((state) => ({
        extraRootNodes: [...state.extraRootNodes, root],
        activeRootId: root.id,
        selectedNodeId: root.id,
        selectedNodeIds: [root.id],
        isModified: true,
        rightPanelTab: "properties",
        renderVersion: state.renderVersion + 1,
      }));
      return root;
    },

    deleteRootNode: (rootId) => {
      const { rootNode, extraRootNodes, activeRootId, selectedNodeId } = get();
      if (getAllRootNodesCount() <= 1) return false;
      if (rootId === rootNode.id) return false;
      get().pushUndo();
      const idx = extraRootNodes.findIndex((r) => r.id === rootId);
      if (idx !== -1) {
        const next = [...extraRootNodes];
        next.splice(idx, 1);
        set({
          extraRootNodes: next,
          activeRootId: activeRootId === rootId ? rootNode.id : activeRootId,
          selectedNodeId: selectedNodeId === rootId ? null : selectedNodeId,
          selectedNodeIds: selectedNodeId === rootId ? [] : get().selectedNodeIds,
          isModified: true,
          renderVersion: get().renderVersion + 1,
        });
      }
      return true;

      function getAllRootNodesCount() {
        return 1 + extraRootNodes.length;
      }
    },

    setCanvasSize: (width, height) => {
      get().pushUndo();
      const { rootNode, extraRootNodes } = get();
      rootNode.props.width = width;
      rootNode.props.height = height;
      for (const root of extraRootNodes) {
        root.props.width = width;
        root.props.height = height;
      }
      set((state) => ({
        canvasWidth: width,
        canvasHeight: height,
        isModified: true,
        renderVersion: state.renderVersion + 1,
      }));
    },

    setScale: (scale) => set({ scale }),
    setPan: (x, y) => set({ panX: x, panY: y }),
    setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
    setEditorActive: (active) => set({ isEditorActive: active }),

    pushUndo: () => {
      const snap = snapshot();
      set((state) => ({
        undoStack: [...state.undoStack, snap].slice(-50),
        redoStack: [],
        renderVersion: state.renderVersion + 1,
      }));
    },

    undo: () => {
      const { undoStack } = get();
      if (undoStack.length === 0) return;
      const current = snapshot();
      const snap = undoStack[undoStack.length - 1];
      set((state) => ({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, current],
      }));
      restore(snap);
    },

    redo: () => {
      const { redoStack } = get();
      if (redoStack.length === 0) return;
      const current = snapshot();
      const snap = redoStack[redoStack.length - 1];
      set((state) => ({
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, current],
      }));
      restore(snap);
    },

    saveScheme: async () => {
      const { isSaving, currentSchemeId, schemeName, schemeDescription, canvasWidth, canvasHeight, rootNode, extraRootNodes } = get();
      if (isSaving) return;
      set({ isSaving: true });
      try {
        const payload = {
          name: schemeName,
          description: schemeDescription,
          canvasWidth,
          canvasHeight,
          rootNode,
          extraRootNodes,
        };
        if (currentSchemeId) {
          await schemeApi.update(currentSchemeId, payload);
        } else {
          const scheme = await schemeApi.create(payload);
          set({ currentSchemeId: scheme.id });
        }
        set({ isModified: false });
      } finally {
        set({ isSaving: false });
      }
    },

    autosave: async () => {
      const { currentSchemeId, isModified, rootNode, extraRootNodes, schemeName, schemeDescription, canvasWidth, canvasHeight } = get();
      if (currentSchemeId && isModified) {
        try {
          await schemeApi.autosave(currentSchemeId, {
            name: schemeName,
            description: schemeDescription,
            canvasWidth,
            canvasHeight,
            rootNode,
            extraRootNodes,
          });
          set({ isModified: false });
        } catch (e) {
          console.error("Autosave failed:", e);
        }
      }
    },

    loadScheme: async (id) => {
      const scheme = await schemeApi.get(id);
      const loadedRoot: UiNode = scheme.root_node && typeof scheme.root_node === "object"
        ? scheme.root_node
        : createRootNode(scheme.canvas_width, scheme.canvas_height);
      // 规范化根节点
      loadedRoot.type = "root";
      loadedRoot.name = loadedRoot.name || "根节点";
      loadedRoot.isRoot = true;
      loadedRoot.isPageRoot = true;
      if (!loadedRoot.props) loadedRoot.props = {} as NodeProps;
      if (!loadedRoot.props.backgroundColor || loadedRoot.props.backgroundColor === "transparent") {
        loadedRoot.props.backgroundColor = "#4d4d4d";
      }
      loadedRoot.props.zIndex = 0;
      loadedRoot.props.x = 0;
      loadedRoot.props.y = 0;

      const loadedExtra: UiNode[] = Array.isArray(scheme.extra_root_nodes)
        ? scheme.extra_root_nodes.map((r: UiNode) => {
            r.type = "root";
            r.isRoot = true;
            r.isPageRoot = true;
            if (!r.props) r.props = {} as NodeProps;
            if (!r.props.backgroundColor) r.props.backgroundColor = "#4d4d4d";
            r.props.zIndex = 0;
            r.props.x = 0;
            r.props.y = 0;
            sanitizeZIndex(r);
            return r;
          })
        : [];
      sanitizeZIndex(loadedRoot);

      set({
        currentSchemeId: scheme.id,
        schemeName: scheme.name,
        schemeDescription: scheme.description,
        canvasWidth: scheme.canvas_width,
        canvasHeight: scheme.canvas_height,
        rootNode: loadedRoot,
        extraRootNodes: loadedExtra,
        activeRootId: loadedRoot.id,
        selectedNodeId: null,
        selectedNodeIds: [],
        undoStack: [],
        redoStack: [],
        isModified: false,
      });
    },

    newScheme: () => {
      const root = createRootNode(1920, 1080);
      set({
        currentSchemeId: null,
        schemeName: "未命名方案",
        schemeDescription: "",
        canvasWidth: 1920,
        canvasHeight: 1080,
        rootNode: root,
        extraRootNodes: [],
        activeRootId: root.id,
        selectedNodeId: null,
        selectedNodeIds: [],
        undoStack: [],
        redoStack: [],
        isModified: true,
      });
    },

    exitEditor: () => set({ isEditorActive: false }),
  };
});

// ============ Template Store ============
import { templateApi, type ComponentTemplate } from "@/lib/uiApi";

interface UiTemplateState {
  templates: ComponentTemplate[];
  loading: boolean;
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: { name: string; nodeData: any; thumbnail?: string }) => Promise<ComponentTemplate>;
  updateTemplate: (id: number, data: { name?: string; nodeData?: any; thumbnail?: string }) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
}

export const useUiTemplateStore = create<UiTemplateState>((set, get) => ({
  templates: [],
  loading: false,
  fetchTemplates: async () => {
    set({ loading: true });
    try {
      const list = await templateApi.list();
      set({ templates: list });
    } finally {
      set({ loading: false });
    }
  },
  createTemplate: async (data) => {
    const tpl = await templateApi.create(data);
    set((state) => ({ templates: [tpl, ...state.templates] }));
    return tpl;
  },
  updateTemplate: async (id, data) => {
    const updated = await templateApi.update(id, data);
    set((state) => ({
      templates: state.templates.map((t) => (t.id === id ? updated : t)),
    }));
  },
  deleteTemplate: async (id) => {
    await templateApi.delete(id);
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }));
  },
}));
