import { useCallback, useEffect, useState } from "react";
import Uploader from "@/components/Uploader";
import ParameterPanel from "@/components/ParameterPanel";
import PreviewCanvas from "@/components/PreviewCanvas";
import ElementGallery from "@/components/ElementGallery";
import BatchActionBar from "@/components/BatchActionBar";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProgressOverlay from "@/components/ProgressOverlay";
import LibraryView from "@/components/LibraryView";
import AtlasBuilderView from "@/components/AtlasBuilderView";
import { useImageStore } from "@/store/useImageStore";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import { Scissors, RotateCcw, Sparkles, Layers3, Boxes } from "lucide-react";
import type { RGBColor } from "@/types";

type Tab = "workspace" | "library" | "atlas";

export default function App() {
  const {
    originalImage,
    fileName,
    elements,
    setOptions,
    clearResult,
    reset,
  } = useImageStore();
  const { process } = useImageProcessor();

  const [tab, setTab] = useState<Tab>("workspace");
  const [isPicking, setIsPicking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // 处理文件
  const handleFile = useCallback(
    (file: File) => {
      void process(file);
    },
    [process]
  );

  // 重新处理
  const handleReprocess = useCallback(() => {
    void process();
  }, [process]);

  // 吸色
  const handleStartPick = () => setIsPicking(true);
  const handlePickColor = (color: RGBColor) => {
    setOptions({ bgColor: color, bgMode: "picker" });
    setIsPicking(false);
  };

  // 关闭/刷新页面前提示
  useEffect(() => {
    if (elements.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [elements.length]);

  const baseName = fileName.replace(/\.[^.]+$/, "") || "elements";

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <header className="border-b border-ink-700 bg-ink-950/60 backdrop-blur-md sticky top-0 z-20">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/30 blur-xl rounded-full" />
              <div className="relative w-9 h-9 rounded-xl bg-ink-900 border border-ink-700 flex items-center justify-center">
                <Scissors size={17} className="text-accent" strokeWidth={2} />
              </div>
            </div>
            <div>
              <h1 className="font-display text-base font-semibold tracking-tight flex items-center gap-2">
                SliceLab
                <span className="badge bg-accent/10 text-accent border border-accent/30">
                  <Sparkles size={9} />
                  v2.0
                </span>
              </h1>
              <p className="text-[11px] text-fg-dim font-mono">
                图像元素拆分器 · 素材库 · 图集打包
              </p>
            </div>
          </div>

          {/* 标签页 */}
          <nav className="flex items-center gap-1 bg-ink-900 border border-ink-700 rounded-lg p-1">
            <TabButton
              active={tab === "workspace"}
              onClick={() => setTab("workspace")}
              icon={<Scissors size={13} strokeWidth={1.8} />}
              label="工作台"
            />
            <TabButton
              active={tab === "library"}
              onClick={() => setTab("library")}
              icon={<Layers3 size={13} strokeWidth={1.8} />}
              label="素材库"
            />
            <TabButton
              active={tab === "atlas"}
              onClick={() => setTab("atlas")}
              icon={<Boxes size={13} strokeWidth={1.8} />}
              label="图集打包"
            />
          </nav>

          <div className="flex items-center gap-2">
            {tab === "workspace" && originalImage && (
              <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-ink-900 border border-ink-700 max-w-[280px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span className="text-xs font-mono text-fg-muted truncate">
                    {fileName}
                  </span>
                </div>
                <Uploader onFile={handleFile} compact />
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="btn-ghost h-9 px-3"
                  title="重置全部"
                >
                  <RotateCcw size={14} strokeWidth={1.8} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 overflow-hidden p-4">
        {tab === "library" ? (
          <LibraryView />
        ) : tab === "atlas" ? (
          <AtlasBuilderView />
        ) : !originalImage ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl">
              <Uploader onFile={handleFile} />
              <FeatureRow />
            </div>
          </div>
        ) : (
          <div className="h-full grid grid-cols-12 gap-4">
            {/* 左侧参数 */}
            <div className="col-span-12 lg:col-span-3 xl:col-span-2 h-full min-h-0">
              <ParameterPanel
                onReprocess={handleReprocess}
                onPickColor={handleStartPick}
                isPicking={isPicking}
              />
            </div>

            {/* 中央预览 */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-6 h-full min-h-0 relative">
              <PreviewCanvas
                onPickColor={handlePickColor}
                isPicking={isPicking}
              />
              <ProgressOverlay />
            </div>

            {/* 右侧画廊 */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-4 h-full min-h-0 flex flex-col gap-3">
              <div className="flex-1 min-h-0">
                <ElementGallery baseName={baseName} />
              </div>
              <BatchActionBar
                baseName={baseName}
                onClear={() => setConfirmClear(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* 确认对话框 */}
      <ConfirmDialog
        open={confirmClear}
        title="清空已识别元素？"
        message="此操作将清除当前所有元素及处理结果，但保留原图。可在需要时重新处理。"
        confirmText="清空"
        danger
        onConfirm={() => {
          clearResult();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmDialog
        open={confirmReset}
        title="重置全部？"
        message="此操作将清除原图、所有元素及处理结果，并恢复默认参数。"
        confirmText="重置"
        danger
        onConfirm={() => {
          reset();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
        active
          ? "bg-accent text-ink-950 font-medium"
          : "text-fg-muted hover:text-fg hover:bg-ink-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FeatureRow() {
  const features = [
    { title: "智能去背景", desc: "自动识别纯色背景并移除" },
    { title: "白边优化", desc: "颜色去污染 + Alpha 收缩" },
    { title: "素材库", desc: "SQLite 入库管理 + 分类" },
    { title: "图集打包", desc: "MaxRects 排版 + Cocos plist" },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
      {features.map((f) => (
        <div
          key={f.title}
          className="panel p-4 hover:border-ink-600 transition-colors"
        >
          <div className="w-1 h-3 bg-accent rounded-full mb-2" />
          <h4 className="text-sm font-medium text-fg mb-1">{f.title}</h4>
          <p className="text-[11px] text-fg-dim leading-snug">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
