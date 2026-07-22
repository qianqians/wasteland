// 容器控件：递归渲染子节点，clip 控制溢出
import type { UiNode } from "@/store/useUiEditorStore";
import { UIRenderer } from "../UIRenderer";

interface Props {
  node: UiNode;
  isEditor?: boolean;
  onSelect?: (id: string) => void;
  onMouseDownNode?: (id: string, e: React.MouseEvent) => void;
  onEvent?: (id: string, type: string) => void;
  onClick?: () => void;
}

function ContainerWidgetBase({
  node,
  isEditor,
  onSelect,
  onMouseDownNode,
  onEvent,
  onClick,
}: Props) {
  const p = node.props;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div
      className="w-full h-full"
      style={{ position: "relative", overflow: p.clip ? "hidden" : "visible" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {hasChildren ? (
        <UIRenderer
          nodes={node.children}
          isEditor={isEditor}
          onSelect={onSelect}
          onMouseDownNode={onMouseDownNode}
          onEvent={onEvent}
        />
      ) : !isEditor ? (
        <div className="w-full h-full flex items-center justify-center text-[12px] text-gray-400">
          空容器
        </div>
      ) : null}
    </div>
  );
}

export const ContainerWidget = ContainerWidgetBase;
