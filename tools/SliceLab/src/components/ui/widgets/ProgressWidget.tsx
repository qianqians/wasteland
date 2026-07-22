// 进度条控件：bg + fill 图片，fillDirection 控制方向
import { useMemo } from "react";
import type { UiNode } from "@/store/useUiEditorStore";
import { getUiAssetFileUrl } from "@/lib/uiApi";

interface Props {
  node: UiNode;
  onClick?: () => void;
}

function ProgressWidgetBase({ node, onClick }: Props) {
  const p = node.props;
  const percent = useMemo(() => {
    const max = p.maxValue || 100;
    const cur = p.currentValue || 0;
    return Math.min(100, Math.max(0, (cur / max) * 100));
  }, [p.maxValue, p.currentValue]);

  const bgUrl = p.bgAssetId ? getUiAssetFileUrl(Number(p.bgAssetId)) : "";
  const fillUrl = p.fillAssetId ? getUiAssetFileUrl(Number(p.fillAssetId)) : "";
  const dir = p.fillDirection || "left-to-right";

  const fillContainerStyle: React.CSSProperties = { position: "absolute", inset: 0, overflow: "hidden" };
  switch (dir) {
    case "right-to-left":
      fillContainerStyle.width = `${percent}%`;
      fillContainerStyle.right = "0";
      fillContainerStyle.left = "auto";
      break;
    case "top-to-bottom":
      fillContainerStyle.height = `${percent}%`;
      fillContainerStyle.top = "0";
      break;
    case "bottom-to-top":
      fillContainerStyle.height = `${percent}%`;
      fillContainerStyle.bottom = "0";
      break;
    default:
      fillContainerStyle.width = `${percent}%`;
  }

  const fillClipStyle: React.CSSProperties = { objectFit: "fill" as const, width: "100%", height: "100%" };
  switch (dir) {
    case "right-to-left":
      fillClipStyle.objectPosition = "right center";
      break;
    case "top-to-bottom":
      fillClipStyle.objectPosition = "center top";
      break;
    case "bottom-to-top":
      fillClipStyle.objectPosition = "center bottom";
      break;
    default:
      fillClipStyle.objectPosition = "left center";
  }

  return (
    <div
      className="w-full h-full relative"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {bgUrl && (
        <img
          src={bgUrl}
          draggable={false}
          className="absolute inset-0 w-full h-full block"
          style={{ objectFit: "fill" }}
        />
      )}
      {fillUrl && (
        <div style={fillContainerStyle}>
          <img src={fillUrl} draggable={false} style={fillClipStyle} />
        </div>
      )}
      {!bgUrl && !fillUrl && (
        <div
          className="absolute inset-0 rounded flex items-center"
          style={{ background: "#374151" }}
        >
          <div
            className="h-full rounded transition-[width] duration-300"
            style={{ width: `${percent}%`, background: "#22c55e" }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-[10px] text-white"
          >
            {p.currentValue}/{p.maxValue}
          </span>
        </div>
      )}
    </div>
  );
}

export const ProgressWidget = ProgressWidgetBase;
