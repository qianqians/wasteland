import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type ImageMeta } from "@/lib/api";
import {
  X,
  Brush,
  Eraser,
  Hand,
  Undo2,
  Redo2,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Save,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Pipette,
  Wand2,
} from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ImageEditorProps {
  image: ImageMeta;
  onClose: () => void;
  onSaved: () => void;
}

type Tool = "brush" | "eraser" | "magic-eraser" | "hand";

const MIN_SCALE = 0.1;
const MAX_SCALE = 16;

/** 生成画笔圆圈光标 SVG data URL，大小随画笔尺寸和缩放变化 */
function makeBrushCursor(displaySize: number): string {
  const sz = Math.max(6, Math.min(128, Math.round(displaySize)));
  const r = sz / 2;
  const total = sz + 4;
  const center = total / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}"><circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="black" stroke-width="1.5"/><circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="white" stroke-width="0.5"/></svg>`;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${center} ${center}, crosshair`;
}

/** 采样 canvas 指定位置像素颜色 */
function samplePixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): string | null {
  if (x < 0 || y < 0 || x >= ctx.canvas.width || y >= ctx.canvas.height) return null;
  const data = ctx.getImageData(x, y, 1, 1).data;
  if (data[3] === 0) return null;
  return (
    "#" +
    [data[0], data[1], data[2]]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

export default function ImageEditor({ image, onClose, onSaved }: ImageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [tool, setTool] = useState<Tool>("brush");
  const [brushSize, setBrushSize] = useState(8);
  const [color, setColor] = useState("#ff3b3b");
  const [magicTolerance, setMagicTolerance] = useState(20); // 超级橡皮容差 0-100
  const [bgColor, setBgColor] = useState<string>(""); // "" = 透明（棋盘格）
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imgW, setImgW] = useState(image.width);
  const [imgH, setImgH] = useState(image.height);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  // Alt 键临时吸色
  const [altPressed, setAltPressed] = useState(false);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // 撤销/重做栈
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 视图 ref（用于事件处理）
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  const toolRef = useRef(tool);
  const brushSizeRef = useRef(brushSize);
  const colorRef = useRef(color);
  const magicToleranceRef = useRef(magicTolerance);
  const altPressedRef = useRef(altPressed);
  scaleRef.current = scale;
  panRef.current = pan;
  toolRef.current = tool;
  brushSizeRef.current = brushSize;
  colorRef.current = color;
  magicToleranceRef.current = magicTolerance;
  altPressedRef.current = altPressed;

  // 平移状态
  const panStateRef = useRef({ panning: false, lastX: 0, lastY: 0 });
  // 画笔绘制状态
  const drawStateRef = useRef({ drawing: false, lastX: 0, lastY: 0 });

  const refreshUndoRedo = () => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  };

  // 画笔圆圈光标
  const brushCursor = useMemo(() => {
    if (tool !== "brush" && tool !== "eraser") return "crosshair";
    return makeBrushCursor(brushSize * scale);
  }, [brushSize, scale, tool]);

  const cursor = altPressed
    ? "crosshair"
    : tool === "hand"
    ? isPanning
      ? "grabbing"
      : "grab"
    : tool === "magic-eraser"
    ? "crosshair"
    : brushCursor;

  // 加载图片
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      setImgW(img.naturalWidth);
      setImgH(img.naturalHeight);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctxRef.current = ctx;
      undoStackRef.current = [];
      redoStackRef.current = [];
      refreshUndoRedo();
      setDirty(false);
      setLoading(false);
      requestAnimationFrame(() => fitZoom(img.naturalWidth, img.naturalHeight));
    };
    img.onerror = () => {
      setError("图片加载失败");
      setLoading(false);
    };
    img.src = api.getImageFileUrl(image.id, image.updated_at);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.id]);

  const fitZoom = useCallback(
    (w?: number, h?: number) => {
      if (!containerRef.current) return;
      const cw = w ?? imgW;
      const ch = h ?? imgH;
      if (cw === 0 || ch === 0) return;
      const c = containerRef.current.getBoundingClientRect();
      const z = Math.min((c.width - 64) / cw, (c.height - 64) / ch, 4);
      setScale(Math.max(MIN_SCALE, z));
      setPan({ x: 0, y: 0 });
    },
    [imgW, imgH]
  );

  const pushUndo = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    undoStackRef.current.push(snap);
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    redoStackRef.current = [];
    refreshUndoRedo();
  };

  const undo = () => {
    const ctx = ctxRef.current;
    if (!ctx || undoStackRef.current.length === 0) return;
    const current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    redoStackRef.current.push(current);
    const prev = undoStackRef.current.pop()!;
    ctx.putImageData(prev, 0, 0);
    refreshUndoRedo();
    setDirty(true);
  };

  const redo = () => {
    const ctx = ctxRef.current;
    if (!ctx || redoStackRef.current.length === 0) return;
    const current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    undoStackRef.current.push(current);
    const next = redoStackRef.current.pop()!;
    ctx.putImageData(next, 0, 0);
    refreshUndoRedo();
    setDirty(true);
  };

  // 屏幕→canvas 像素坐标
  const screenToCanvas = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // 画笔绘制
  const drawLine = (
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    isEraser: boolean
  ) => {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSizeRef.current;
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = colorRef.current;
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  };

  // 超级橡皮：从点击位置开始洪水填充，删除所有颜色相近的连通像素
  const floodFillErase = (
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    tolerance: number // 0-100
  ) => {
    const canvas = ctx.canvas;
    const w = canvas.width;
    const h = canvas.height;
    if (startX < 0 || startY < 0 || startX >= w || startY >= h) return;

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const startIdx = (startY * w + startX) * 4;
    const startA = data[startIdx + 3];
    // 起点已透明，不操作（避免误触）
    if (startA === 0) return;
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];

    const threshold = (tolerance / 100) * 180; // RGB 距离阈值
    const visited = new Uint8Array(w * h);
    const stack: number[] = [startY * w + startX];
    visited[startY * w + startX] = 1;

    const dx = [-1, 1, 0, 0];
    const dy = [0, 0, -1, 1];

    while (stack.length > 0) {
      const p = stack.pop()!;
      const i = p * 4;
      // 擦除该像素
      data[i + 3] = 0;

      const cx = p % w;
      const cy = (p / w) | 0;

      for (let k = 0; k < 4; k++) {
        const nx = cx + dx[k];
        const ny = cy + dy[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const np = ny * w + nx;
        if (visited[np]) continue;
        const ni = np * 4;
        const na = data[ni + 3];
        if (na === 0) continue; // 已透明
        const dr = data[ni] - startR;
        const dg = data[ni + 1] - startG;
        const db = data[ni + 2] - startB;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist > threshold) continue;
        visited[np] = 1;
        stack.push(np);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent) => {
    // Alt 吸色：左键点击采样颜色
    if (e.button === 0 && altPressedRef.current) {
      const ctx = ctxRef.current;
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (!ctx || !pos) return;
      const hex = samplePixel(ctx, Math.floor(pos.x), Math.floor(pos.y));
      if (hex) setColor(hex);
      setAltPressed(false);
      setPreviewColor(null);
      return;
    }

    // 中键 或 手型工具：平移
    if (e.button === 1 || (e.button === 0 && toolRef.current === "hand")) {
      e.preventDefault();
      panStateRef.current = { panning: true, lastX: e.clientX, lastY: e.clientY };
      setIsPanning(true);
      return;
    }

    if (e.button !== 0) return;

    // 超级橡皮：点击位置洪水填充擦除
    if (toolRef.current === "magic-eraser") {
      const pos = screenToCanvas(e.clientX, e.clientY);
      const ctx = ctxRef.current;
      if (!ctx || !pos) return;
      pushUndo();
      setDirty(true);
      floodFillErase(ctx, Math.floor(pos.x), Math.floor(pos.y), magicToleranceRef.current);
      return;
    }

    // 画笔/橡皮
    if (toolRef.current === "brush" || toolRef.current === "eraser") {
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (!pos) return;
      pushUndo();
      setDirty(true);
      drawStateRef.current = { drawing: true, lastX: pos.x, lastY: pos.y };
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.save();
        ctx.fillStyle = toolRef.current === "eraser" ? "rgba(0,0,0,1)" : colorRef.current;
        ctx.globalCompositeOperation = toolRef.current === "eraser" ? "destination-out" : "source-over";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, brushSizeRef.current / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent) => {
    // 平移
    if (panStateRef.current.panning) {
      const dx = e.clientX - panStateRef.current.lastX;
      const dy = e.clientY - panStateRef.current.lastY;
      panStateRef.current.lastX = e.clientX;
      panStateRef.current.lastY = e.clientY;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      return;
    }

    // Alt 吸色预览
    if (altPressedRef.current) {
      const ctx = ctxRef.current;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setPreviewPos({ x: e.clientX - containerRect.left, y: e.clientY - containerRect.top });
      }
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (ctx && pos) {
        const hex = samplePixel(ctx, Math.floor(pos.x), Math.floor(pos.y));
        setPreviewColor(hex);
      }
      return;
    }

    // 绘制
    if (drawStateRef.current.drawing) {
      const ctx = ctxRef.current;
      const pos = screenToCanvas(e.clientX, e.clientY);
      if (!ctx || !pos) return;
      const isEraser = toolRef.current === "eraser";
      drawLine(
        ctx,
        drawStateRef.current.lastX,
        drawStateRef.current.lastY,
        pos.x,
        pos.y,
        isEraser
      );
      drawStateRef.current.lastX = pos.x;
      drawStateRef.current.lastY = pos.y;
    }
  };

  const handleMouseUp = () => {
    panStateRef.current.panning = false;
    drawStateRef.current.drawing = false;
    setIsPanning(false);
  };

  // 滚轮缩放（以鼠标为中心）
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const oldScale = scaleRef.current;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale + delta));
    if (newScale === oldScale) return;
    const imgX = (mouseX - panRef.current.x) / oldScale;
    const imgY = (mouseY - panRef.current.y) / oldScale;
    setPan({ x: mouseX - imgX * newScale, y: mouseY - imgY * newScale });
    setScale(newScale);
  };

  // 旋转 90°
  const rotate90 = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    pushUndo();
    const tmp = document.createElement("canvas");
    tmp.width = canvas.height;
    tmp.height = canvas.width;
    const tctx = tmp.getContext("2d")!;
    tctx.translate(tmp.width / 2, tmp.height / 2);
    tctx.rotate(Math.PI / 2);
    tctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tmp.width;
    canvas.height = tmp.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0);
    setImgW(canvas.width);
    setImgH(canvas.height);
    setDirty(true);
    requestAnimationFrame(() => fitZoom(canvas.width, canvas.height));
  };

  const flipH = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    pushUndo();
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const tctx = tmp.getContext("2d")!;
    tctx.translate(canvas.width, 0);
    tctx.scale(-1, 1);
    tctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0);
    setDirty(true);
  };

  const flipV = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    pushUndo();
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const tctx = tmp.getContext("2d")!;
    tctx.translate(0, canvas.height);
    tctx.scale(1, -1);
    tctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0);
    setDirty(true);
  };

  // 保存
  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) throw new Error("生成 PNG 失败");
      await api.updateImageData(image.id, blob);
      setDirty(false);
      setConfirmSave(false);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (dirty) setConfirmClose(true);
    else onClose();
  };

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      // Alt 键临时吸色
      if (e.key === "Alt" && !e.repeat) {
        e.preventDefault();
        setAltPressed(true);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "b") setTool("brush");
      else if (e.key === "e") setTool("eraser");
      else if (e.key === "r") setTool("magic-eraser");
      else if (e.key === "h") setTool("hand");
      else if (e.key === "[") setBrushSize((s) => Math.max(1, s - 2));
      else if (e.key === "]") setBrushSize((s) => Math.min(100, s + 2));
    };

    const keyupHandler = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        setAltPressed(false);
        setPreviewColor(null);
      }
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", keyupHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", keyupHandler);
    };
  }, [undo, redo]);

  // 窗口失焦时释放 Alt 状态
  useEffect(() => {
    const onBlur = () => {
      setAltPressed(false);
      setPreviewColor(null);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // 阻止页面滚动
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
      {/* 顶部工具栏 */}
      <header className="px-4 py-2.5 border-b border-ink-700 flex items-center justify-between gap-3 flex-wrap bg-ink-900">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 工具 */}
          <div className="flex items-center gap-1 bg-ink-950 border border-ink-700 rounded-md p-1">
            <ToolBtn active={tool === "brush"} onClick={() => setTool("brush")} title="画笔 (B)">
              <Brush size={14} strokeWidth={1.8} />
            </ToolBtn>
            <ToolBtn active={tool === "eraser"} onClick={() => setTool("eraser")} title="橡皮 (E)">
              <Eraser size={14} strokeWidth={1.8} />
            </ToolBtn>
            <ToolBtn active={tool === "magic-eraser"} onClick={() => setTool("magic-eraser")} title="超级橡皮：点击删除相近色块 (R)">
              <Wand2 size={14} strokeWidth={1.8} />
            </ToolBtn>
            <ToolBtn active={tool === "hand"} onClick={() => setTool("hand")} title="手型/平移 (H)">
              <Hand size={14} strokeWidth={1.8} />
            </ToolBtn>
          </div>

          <span className="text-ink-700">|</span>

          {/* 画笔大小（画笔/橡皮时显示） */}
          {tool !== "magic-eraser" && (
            <div className="flex items-center gap-2 px-2 py-1 bg-ink-950 border border-ink-700 rounded-md">
              <span className="text-[10px] text-fg-dim font-mono">大小</span>
              <input
                type="range"
                min={1}
                max={100}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-[10px] text-fg-muted font-mono w-8 text-center">{brushSize}</span>
            </div>
          )}

          {/* 超级橡皮容差（magic-eraser 时显示） */}
          {tool === "magic-eraser" && (
            <div className="flex items-center gap-2 px-2 py-1 bg-ink-950 border border-ink-700 rounded-md">
              <span className="text-[10px] text-fg-dim font-mono">容差</span>
              <input
                type="range"
                min={0}
                max={100}
                value={magicTolerance}
                onChange={(e) => setMagicTolerance(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-[10px] text-fg-muted font-mono w-8 text-center">{magicTolerance}</span>
            </div>
          )}

          {/* 颜色 */}
          <div className="flex items-center gap-2 px-2 py-1 bg-ink-950 border border-ink-700 rounded-md">
            <span className="text-[10px] text-fg-dim font-mono">颜色</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-none"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-mono text-fg-muted w-20"
            />
            {altPressed && (
              <span className="text-[9px] text-accent font-mono flex items-center gap-0.5">
                <Pipette size={9} /> Alt 吸色
              </span>
            )}
          </div>

          {/* 背景色 */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-ink-950 border border-ink-700 rounded-md">
            <span className="text-[10px] text-fg-dim font-mono">背景</span>
            <input
              type="color"
              value={bgColor || "#ffffff"}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
              title="设置背景色观察"
            />
            <button
              type="button"
              onClick={() => setBgColor("")}
              className={`text-[9px] px-1.5 py-0.5 rounded ${!bgColor ? "bg-accent text-ink-950" : "text-fg-muted hover:text-fg"}`}
              title="透明背景"
            >
              透明
            </button>
          </div>

          <span className="text-ink-700">|</span>

          {/* 撤销/重做 */}
          <div className="flex items-center gap-1 bg-ink-950 border border-ink-700 rounded-md p-1">
            <ToolBtn onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
              <Undo2 size={14} strokeWidth={1.8} />
            </ToolBtn>
            <ToolBtn onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">
              <Redo2 size={14} strokeWidth={1.8} />
            </ToolBtn>
          </div>

          <span className="text-ink-700">|</span>

          {/* 变换 */}
          <div className="flex items-center gap-1 bg-ink-950 border border-ink-700 rounded-md p-1">
            <ToolBtn onClick={rotate90} title="旋转 90°">
              <RotateCw size={14} strokeWidth={1.8} />
            </ToolBtn>
            <ToolBtn onClick={flipH} title="水平翻转">
              <FlipHorizontal2 size={14} strokeWidth={1.8} />
            </ToolBtn>
            <ToolBtn onClick={flipV} title="垂直翻转">
              <FlipVertical2 size={14} strokeWidth={1.8} />
            </ToolBtn>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 缩放控制 */}
          <div className="flex items-center gap-1 bg-ink-950 border border-ink-700 rounded-md p-1">
            <ToolBtn
              onClick={() => setScale((s) => Math.max(MIN_SCALE, s - 0.1))}
              title="缩小"
            >
              <ZoomOut size={13} strokeWidth={1.8} />
            </ToolBtn>
            <span className="font-mono text-[10px] text-fg-muted w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <ToolBtn
              onClick={() => setScale((s) => Math.min(MAX_SCALE, s + 0.1))}
              title="放大"
            >
              <ZoomIn size={13} strokeWidth={1.8} />
            </ToolBtn>
            <ToolBtn onClick={() => fitZoom()} title="适应窗口">
              <Maximize2 size={13} strokeWidth={1.8} />
            </ToolBtn>
          </div>

          <span className="text-ink-700">|</span>

          <button
            type="button"
            onClick={() => setConfirmSave(true)}
            disabled={!dirty || saving}
            className="btn-primary h-8 px-3 text-xs"
          >
            {saving ? <Loader2 size={13} className="animate-spin-slow" /> : <Save size={13} strokeWidth={1.9} />}
            保存
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="btn-ghost h-8 w-8 p-0"
            title="关闭"
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* 画布区域 */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative ${bgColor ? "" : "checker-bg"}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor, backgroundColor: bgColor || undefined }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="text-accent animate-spin-slow" />
          </div>
        )}
        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-danger text-xs px-3 py-2 bg-danger/10 border border-danger/30 rounded-md">
            {error}
          </div>
        )}
        <div
          className="absolute"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <canvas
            ref={canvasRef}
            className="block shadow-2xl"
            style={{ imageRendering: scale >= 4 ? "pixelated" : "auto" }}
          />
        </div>

        {/* Alt 吸色预览浮层 */}
        {altPressed && previewColor !== null && (
          <div
            className="absolute pointer-events-none z-10 flex items-center gap-1.5 bg-ink-950/95 border border-ink-600 rounded px-2 py-1 text-[10px] font-mono"
            style={{ left: previewPos.x + 18, top: previewPos.y + 18 }}
          >
            <Pipette size={10} className="text-accent" />
            <div
              className="w-4 h-4 rounded border border-ink-600"
              style={{ backgroundColor: previewColor || "transparent" }}
            />
            <span className="text-fg">{previewColor || "透明"}</span>
          </div>
        )}
        {altPressed && previewColor === null && (
          <div
            className="absolute pointer-events-none z-10 flex items-center gap-1.5 bg-ink-950/95 border border-ink-600 rounded px-2 py-1 text-[10px] font-mono"
            style={{ left: previewPos.x + 18, top: previewPos.y + 18 }}
          >
            <Pipette size={10} className="text-fg-dim" />
            <span className="text-fg-dim">透明</span>
          </div>
        )}

        {/* 状态信息 */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-ink-950/80 border border-ink-700 rounded px-2 py-1 text-[10px] font-mono text-fg-muted pointer-events-none">
          <span className="text-fg-muted truncate max-w-[160px]">{image.name}</span>
          <span className="text-ink-700">·</span>
          <span>{imgW}×{imgH}</span>
          <span className="text-ink-700">·</span>
          <span>{Math.round(scale * 100)}%</span>
          {dirty && <span className="text-accent">· 未保存</span>}
        </div>

        {/* 提示 */}
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-fg-dim bg-ink-950/80 border border-ink-700 rounded px-2 py-1 pointer-events-none">
          滚轮缩放 · 中键/手型拖动 · B 画笔 E 橡皮 R 超级橡皮 H 手型 · Alt 临时吸色 · [ ] 调整大小
        </div>
      </div>

      {/* 保存确认 */}
      <ConfirmDialog
        open={confirmSave}
        title="保存修改到原图？"
        message="此操作将覆盖数据库中的原始图片数据，不可撤销。"
        confirmText="保存"
        danger
        onConfirm={handleSave}
        onCancel={() => setConfirmSave(false)}
      />

      {/* 关闭确认 */}
      <ConfirmDialog
        open={confirmClose}
        title="关闭编辑器？"
        message="有未保存的修改，关闭后将丢失。确定要关闭吗？"
        confirmText="关闭不保存"
        danger
        onConfirm={() => {
          setConfirmClose(false);
          onClose();
        }}
        onCancel={() => setConfirmClose(false)}
      />
    </div>
  );
}

function ToolBtn({
  active,
  onClick,
  title,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? "bg-accent text-ink-950"
          : "text-fg-muted hover:text-fg hover:bg-ink-800"
      } disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
    >
      {children}
    </button>
  );
}
