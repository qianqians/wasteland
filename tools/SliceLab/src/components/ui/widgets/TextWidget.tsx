// 文本控件：渲染文本，ResizeObserver 自动测量高度
import { useEffect, useRef } from "react";
import type { UiNode } from "@/store/useUiEditorStore";

interface Props {
  node: UiNode;
  onClick?: () => void;
  onResize?: (height: number) => void;
}

function TextWidgetBase({ node, onClick, onResize }: Props) {
  const p = node.props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const h = el.scrollHeight;
      if (h > 0 && h !== p.height) {
        onResize?.(h);
      }
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.content, p.fontSize, p.fontFamily, p.lineHeight, p.width]);

  const contentStyle: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    width: "100%",
    fontSize: p.fontSize ? `${p.fontSize}px` : undefined,
    color: p.color,
    fontFamily: p.fontFamily,
    textAlign: p.textAlign,
    lineHeight: p.lineHeight != null ? String(p.lineHeight) : undefined,
  };
  if (p.strokeColor && p.strokeWidth) {
    contentStyle.textShadow = `0 0 ${p.strokeWidth}px ${p.strokeColor}, 0 0 ${p.strokeWidth}px ${p.strokeColor}`;
  }

  return (
    <div
      className="w-full h-full flex items-start overflow-hidden"
      style={{ backgroundColor: p.backgroundColor }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div ref={ref} style={contentStyle}>
        {p.content ? p.content : <span style={{ color: "rgba(156,163,175,1)" }}>文本</span>}
      </div>
    </div>
  );
}

export const TextWidget = TextWidgetBase;
