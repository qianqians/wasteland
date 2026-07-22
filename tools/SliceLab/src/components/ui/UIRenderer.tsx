// UIRenderer：递归渲染节点树
// 根节点/容器创建独立 stacking context，透明度只作用于背景
// 注意：不使用 memo —— 编辑器拖拽时直接 mutate node.props，memo 会阻止子树重渲染导致选中框与控件错位
import type { UiNode } from "@/store/useUiEditorStore";
import { getUiAssetFileUrl } from "@/lib/uiApi";
import { ImageWidget } from "./widgets/ImageWidget";
import { TextWidget } from "./widgets/TextWidget";
import { ContainerWidget } from "./widgets/ContainerWidget";
import { ButtonWidget } from "./widgets/ButtonWidget";
import { ProgressWidget } from "./widgets/ProgressWidget";

interface Props {
  nodes: UiNode[];
  isEditor?: boolean;
  onSelect?: (id: string) => void;
  onMouseDownNode?: (id: string, e: React.MouseEvent) => void;
  onEvent?: (id: string, type: string, payload?: any) => void;
}

// 将颜色和透明度合并为 rgba 字符串（透明度只作用于背景）
function applyAlphaToColor(color: string | undefined, alpha: number): string {
  if (!color || color === "transparent") return "transparent";
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

function getNodeStyle(node: UiNode, isEditor?: boolean): React.CSSProperties {
  const p = node.props;
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${p.x}px`,
    top: `${p.y}px`,
    width: `${p.width}px`,
    height: `${p.height}px`,
    transform: p.rotation ? `rotate(${p.rotation}deg)` : "none",
    cursor: node.type === "container" ? "default" : "pointer",
    pointerEvents: p.locked ? "none" : "auto",
    zIndex: p.zIndex != null ? String(p.zIndex) : "auto",
  };
  if (node.type === "root") {
    style.zIndex = "0";
    style.isolation = "isolate";
    style.backgroundColor = p.backgroundColor || "#4d4d4d";
    style.cursor = "default";
    // 根节点背景图片
    if (p.rootBgAssetId !== undefined && p.rootBgAssetId !== "") {
      const url = getUiAssetFileUrl(Number(p.rootBgAssetId));
      const bgMode = p.rootBgFillMode || "contain";
      if (bgMode === "repeat-x" || bgMode === "repeat-y" || bgMode === "repeat") {
        style.backgroundImage = `url(${url})`;
        style.backgroundRepeat = bgMode;
        style.backgroundSize = `${p.rootBgTileWidth || 100}px ${p.rootBgTileHeight || 100}px`;
      } else {
        style.backgroundImage = `url(${url})`;
        style.backgroundRepeat = "no-repeat";
        style.backgroundSize = bgMode === "fill" ? "100% 100%" : bgMode;
        style.backgroundPosition = "center";
      }
    }
  } else if (node.type === "container") {
    style.isolation = "isolate";
    if (isEditor && p.backgroundColor) {
      const alpha = p.opacity != null ? p.opacity : 1;
      style.backgroundColor = applyAlphaToColor(p.backgroundColor, alpha);
    } else {
      style.backgroundColor = "transparent";
    }
    // 编辑模式下容器显示淡边框
    if (isEditor) {
      style.outline = "2px dashed rgba(96,165,250,0.3)";
      style.outlineOffset = "-2px";
    }
  } else {
    style.opacity = p.opacity ?? 1;
    // 编辑模式下所有控件显示淡边框，便于识别
    if (isEditor) {
      style.outline = "2px solid rgba(255,255,255,0.18)";
      style.outlineOffset = "-1px";
    }
  }
  if (p.visible === false) {
    style.display = "none";
  }
  return style;
}

function UIRendererBase({ nodes, isEditor, onSelect, onMouseDownNode, onEvent }: Props) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {nodes.map((node) => {
        if (node.props.visible === false) return null;
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          onSelect?.(node.id);
        };
        const handleMouseDown = (e: React.MouseEvent) => {
          e.stopPropagation();
          onMouseDownNode?.(node.id, e);
        };
        return (
          <div
            key={node.id}
            style={getNodeStyle(node, isEditor)}
            data-node-id={node.id}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
          >
            {node.type === "image" && (
              <ImageWidget node={node} onClick={() => onSelect?.(node.id)} />
            )}
            {node.type === "text" && (
              <TextWidget
                node={node}
                onClick={() => onSelect?.(node.id)}
                onResize={(h) => onEvent?.(node.id, "resize", h)}
              />
            )}
            {(node.type === "container" || node.type === "root") && (
              <ContainerWidget
                node={node}
                isEditor={isEditor}
                onClick={() => onSelect?.(node.id)}
                onSelect={onSelect}
                onMouseDownNode={onMouseDownNode}
                onEvent={onEvent}
              />
            )}
            {node.type === "button" && (
              <ButtonWidget node={node} onClick={() => onSelect?.(node.id)} />
            )}
            {node.type === "progress" && (
              <ProgressWidget node={node} onClick={() => onSelect?.(node.id)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const UIRenderer = UIRendererBase;
