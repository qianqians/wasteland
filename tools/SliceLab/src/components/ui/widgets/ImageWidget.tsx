// 图片控件：九宫格裁切 / 普通填充 / 占位
import { useMemo } from "react";
import type { UiNode } from "@/store/useUiEditorStore";
import { getUiAssetFileUrl } from "@/lib/uiApi";

interface Props {
  node: UiNode;
  onClick?: () => void;
}

function ImageWidgetBase({ node, onClick }: Props) {
  const p = node.props;
  const assetId = p.assetId as string | number | undefined;
  const imageUrl = useMemo(() => {
    if (!assetId && assetId !== 0) return "";
    return getUiAssetFileUrl(Number(assetId));
  }, [assetId]);

  const nineSliceEnabled = !!p.nineSliceEnabled;
  const top = p.sliceTop || 0;
  const right = p.sliceRight || 0;
  const bottom = p.sliceBottom || 0;
  const left = p.sliceLeft || 0;

  const mode = p.fillMode || "contain";

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {imageUrl && nineSliceEnabled ? (
        <div
          className="w-full h-full"
          style={{
            borderStyle: "solid",
            borderWidth: `${top}px ${right}px ${bottom}px ${left}px`,
            borderImageSource: `url(${imageUrl})`,
            borderImageSlice: `${top} ${right} ${bottom} ${left} fill`,
            borderImageRepeat: "round",
            boxSizing: "border-box",
          }}
        />
      ) : imageUrl && (mode === "repeat-x" || mode === "repeat-y" || mode === "repeat") ? (
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundRepeat: mode,
            backgroundSize: `${p.tileWidth || 100}px ${p.tileHeight || 100}px`,
          }}
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          draggable={false}
          className="block max-w-full max-h-full"
          style={{
            objectFit: mode as React.CSSProperties["objectFit"],
            width: mode === "fill" ? "100%" : "auto",
            height: mode === "fill" ? "100%" : "auto",
          }}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1 text-[14px]"
          style={{
            background: "rgba(30,41,59,0.85)",
            color: "rgba(209,213,219,1)",
            border: "2px dashed rgba(148,163,184,0.8)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            width={24}
            height={24}
            style={{ color: "rgba(156,163,175,1)" }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>图片</span>
        </div>
      )}
    </div>
  );
}

export const ImageWidget = ImageWidgetBase;
