// 按钮控件：normal/hover/pressed/disabled 切换 assetUrl
import { useState } from "react";
import type { UiNode } from "@/store/useUiEditorStore";
import { getUiAssetFileUrl } from "@/lib/uiApi";

interface Props {
  node: UiNode;
  onClick?: () => void;
}

function ButtonWidgetBase({ node, onClick }: Props) {
  const p = node.props;
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  let currentAssetUrl = "";
  if (p.disabled && p.disabledAssetId) {
    currentAssetUrl = getUiAssetFileUrl(Number(p.disabledAssetId));
  } else if (pressed && p.pressedAssetId) {
    currentAssetUrl = getUiAssetFileUrl(Number(p.pressedAssetId));
  } else if (hover && p.hoverAssetId) {
    currentAssetUrl = getUiAssetFileUrl(Number(p.hoverAssetId));
  } else if (p.normalAssetId) {
    currentAssetUrl = getUiAssetFileUrl(Number(p.normalAssetId));
  }

  let stateClass = "state-normal";
  if (p.disabled) stateClass = "state-disabled";
  else if (pressed) stateClass = "state-pressed";
  else if (hover) stateClass = "state-hover";

  return (
    <div
      className="w-full h-full relative"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {currentAssetUrl ? (
        <img
          src={currentAssetUrl}
          draggable={false}
          className="w-full h-full block"
          style={{ objectFit: "fill" }}
        />
      ) : (
        <div
          className={`w-full h-full flex flex-col items-center justify-center gap-1 rounded border border-dashed border-white/40 text-white ${stateClass}`}
        >
          <svg
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="8" width="20" height="8" rx="4" />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-[14px] text-white">{node.name || "按钮"}</span>
        </div>
      )}
      <style>{`
        .state-disabled { opacity: 0.5; cursor: not-allowed; background: #6b7280; }
        .state-pressed { background: #1e40af; }
        .state-hover { background: #2563eb; }
        .state-normal { background: #3b82f6; cursor: pointer; }
      `}</style>
    </div>
  );
}

export const ButtonWidget = ButtonWidgetBase;
