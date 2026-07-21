import { useEffect, useRef, useState, useCallback } from "react";
import { useImageStore } from "@/store/useImageStore";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Crosshair,
  Hand,
} from "lucide-react";
import type { RGBColor } from "@/types";

interface PreviewCanvasProps {
  /** 当处于颜色吸取模式时，点击画布会回调此函数 */
  onPickColor?: (color: RGBColor) => void;
  isPicking?: boolean;
}

type ViewMode = "original" | "processed";

const MIN_SCALE = 0.05;
const MAX_SCALE = 8;

export default function PreviewCanvas({
  onPickColor,
  isPicking = false,
}: PreviewCanvasProps) {
  const { originalImage, processedCanvasUrl, fileName } = useImageStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [view, setView] = useState<ViewMode>("processed");
  const [hoverColor, setHoverColor] = useState<RGBColor | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const naturalW = originalImage?.naturalWidth ?? 0;
  const naturalH = originalImage?.naturalHeight ?? 0;

  // 平移状态（用 ref 避免重渲染）
  const panStateRef = useRef({ panning: false, lastX: 0, lastY: 0 });
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  scaleRef.current = scale;
  panRef.current = pan;

  useEffect(() => {
    if (originalImage && !processedCanvasUrl) setView("original");
    if (processedCanvasUrl) setView("processed");
  }, [originalImage, processedCanvasUrl]);

  // 将原图绘制到隐藏 canvas，用于吸取颜色时取像素
  useEffect(() => {
    if (!originalImage || !canvasRef.current || naturalW === 0) return;
    const canvas = canvasRef.current;
    canvas.width = naturalW;
    canvas.height = naturalH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, naturalW, naturalH);
    ctx.drawImage(originalImage, 0, 0, naturalW, naturalH);
  }, [originalImage, naturalW, naturalH]);

  // 图片加载后自动适应
  const fitZoom = useCallback(() => {
    if (!containerRef.current || naturalW === 0) return;
    const c = containerRef.current.getBoundingClientRect();
    const z = Math.min(
      (c.width - 48) / naturalW,
      (c.height - 48) / naturalH,
      1
    );
    const newScale = Math.max(MIN_SCALE, z);
    setScale(newScale);
    setPan({ x: 0, y: 0 });
  }, [naturalW, naturalH]);

  if (!originalImage) return null;

  // 滚轮缩放（以鼠标为中心）
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const oldScale = scaleRef.current;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale + delta));
    if (newScale === oldScale) return;
    // 鼠标在图片像素坐标
    const imgX = (mouseX - panRef.current.x) / oldScale;
    const imgY = (mouseY - panRef.current.y) / oldScale;
    // 新 pan 使鼠标位置对应同一图片点
    setPan({ x: mouseX - imgX * newScale, y: mouseY - imgY * newScale });
    setScale(newScale);
  };

  // 中键 / 左键空白平移
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 吸色模式下不平移
    if (isPicking) return;
    // 中键 (button===1) 或 左键 (button===0) 点在空白处
    if (e.button === 1 || e.button === 0) {
      e.preventDefault();
      panStateRef.current = {
        panning: true,
        lastX: e.clientX,
        lastY: e.clientY,
      };
      setIsPanning(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panStateRef.current.panning) {
      const dx = e.clientX - panStateRef.current.lastX;
      const dy = e.clientY - panStateRef.current.lastY;
      panStateRef.current.lastX = e.clientX;
      panStateRef.current.lastY = e.clientY;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  };

  const handleMouseUp = () => {
    panStateRef.current.panning = false;
    setIsPanning(false);
  };

  // 吸色：点击隐藏 canvas 取像素
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPicking || !onPickColor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * naturalW);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * naturalH);
    if (x < 0 || y < 0 || x >= naturalW || y >= naturalH) return;
    const data = ctx.getImageData(x, y, 1, 1).data;
    onPickColor({ r: data[0], g: data[1], b: data[2] });
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPicking) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * naturalW);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * naturalH);
    if (x < 0 || y < 0 || x >= naturalW || y >= naturalH) return;
    const data = ctx.getImageData(x, y, 1, 1).data;
    setHoverColor({ r: data[0], g: data[1], b: data[2] });
  };

  const cursor = isPicking
    ? "crosshair"
    : isPanning
    ? "grabbing"
    : "grab";

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      {/* 顶部工具栏 */}
      <header className="px-4 py-3 border-b border-ink-700 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-ink-700 overflow-hidden">
            <TabButton
              active={view === "original"}
              onClick={() => setView("original")}
              icon={<EyeOff size={13} strokeWidth={1.8} />}
              label="原图"
            />
            <TabButton
              active={view === "processed"}
              onClick={() => setView("processed")}
              icon={<Eye size={13} strokeWidth={1.8} />}
              label="去背景"
              disabled={!processedCanvasUrl}
            />
          </div>
          {isPicking ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 border border-accent/40 text-accent text-xs animate-pulse-soft">
              <Crosshair size={12} strokeWidth={2} />
              <span>点击图片吸取颜色</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-ink-900 border border-ink-700 text-fg-dim text-[10px] font-mono">
              <Hand size={11} strokeWidth={1.8} />
              <span>滚轮缩放 · 中键/左键拖动平移</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <IconBtn
            onClick={() => {
              const ns = Math.max(MIN_SCALE, scaleRef.current - 0.1);
              setScale(ns);
            }}
            title="缩小"
          >
            <ZoomOut size={14} strokeWidth={1.8} />
          </IconBtn>
          <span className="font-mono text-[11px] text-fg-muted w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <IconBtn
            onClick={() => {
              const ns = Math.min(MAX_SCALE, scaleRef.current + 0.1);
              setScale(ns);
            }}
            title="放大"
          >
            <ZoomIn size={14} strokeWidth={1.8} />
          </IconBtn>
          <IconBtn onClick={fitZoom} title="适应窗口">
            <Maximize2 size={14} strokeWidth={1.8} />
          </IconBtn>
        </div>
      </header>

      {/* 画布：transform 缩放平移 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden checker-bg relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        style={{ cursor }}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: naturalW,
            height: naturalH,
          }}
        >
          <div className="relative shadow-2xl" style={{ width: naturalW, height: naturalH }}>
            {/* 原图层 */}
            <img
              src={originalImage.src}
              alt={fileName}
              className="absolute inset-0 w-full h-full object-contain transition-opacity"
              style={{ opacity: view === "original" ? 1 : 0 }}
              onLoad={fitZoom}
              draggable={false}
            />
            {/* 处理后层 */}
            {processedCanvasUrl && (
              <img
                src={processedCanvasUrl}
                alt="processed"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ opacity: view === "processed" ? 1 : 0 }}
                draggable={false}
              />
            )}
            {/* 吸色用隐藏 canvas（仅吸色时接收事件） */}
            <canvas
              ref={canvasRef}
              width={naturalW}
              height={naturalH}
              className="absolute inset-0 w-full h-full"
              style={{
                opacity: 0,
                pointerEvents: isPicking ? "auto" : "none",
              }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMove}
            />
          </div>
        </div>

        {/* 缩放/坐标信息 */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-ink-950/80 border border-ink-700 rounded px-2 py-1 text-[10px] font-mono text-fg-muted pointer-events-none">
          <span>{Math.round(scale * 100)}%</span>
          <span className="text-ink-700">·</span>
          <span>
            {naturalW}×{naturalH}
          </span>
          {pan.x !== 0 || pan.y !== 0 ? (
            <>
              <span className="text-ink-700">·</span>
              <span>
                {Math.round(pan.x)},{Math.round(pan.y)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* 底部状态栏 */}
      <footer className="px-4 py-2 border-t border-ink-700 flex items-center justify-between text-[11px] font-mono text-fg-dim">
        <div className="flex items-center gap-3">
          <span className="text-fg-muted truncate max-w-[200px]">{fileName}</span>
          <span className="text-ink-500">·</span>
          <span>{naturalW} × {naturalH}</span>
        </div>
        {hoverColor && isPicking && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm border border-ink-600"
              style={{
                backgroundColor: `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})`,
              }}
            />
            <span className="text-accent">
              #{hoverColor.r.toString(16).padStart(2, "0")}
              {hoverColor.g.toString(16).padStart(2, "0")}
              {hoverColor.b.toString(16).padStart(2, "0")}
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${
        active
          ? "bg-accent text-ink-950"
          : "bg-transparent text-fg-muted hover:text-fg hover:bg-ink-800"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {icon}
      {label}
    </button>
  );
}

function IconBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-ink-800 transition-colors"
    >
      {children}
    </button>
  );
}
