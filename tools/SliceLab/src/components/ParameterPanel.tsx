import { useState } from "react";
import { useImageStore } from "@/store/useImageStore";
import { hexToRgb, rgbToHex } from "@/lib/imageUtils";
import type { BgMode } from "@/types";
import {
  Wand2,
  Pipette,
  Eye,
  Ruler,
  Square,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface ParameterPanelProps {
  onReprocess: () => void;
  onPickColor: () => void;
  isPicking: boolean;
}

export default function ParameterPanel({
  onReprocess,
  onPickColor,
  isPicking,
}: ParameterPanelProps) {
  const { options, setOptions, detectedBgColor, progress } = useImageStore();
  const [hexInput, setHexInput] = useState(
    options.bgColor ? rgbToHex(options.bgColor) : "#FFFFFF"
  );

  const isProcessing = progress.status === "processing" || progress.status === "loading";

  const updateBgMode = (mode: BgMode) => setOptions({ bgMode: mode });

  const updateHex = (hex: string) => {
    setHexInput(hex);
    const rgb = hexToRgb(hex);
    if (rgb) setOptions({ bgColor: rgb });
  };

  return (
    <aside className="panel flex flex-col h-full overflow-hidden">
      <header className="px-5 py-4 border-b border-ink-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 size={15} className="text-accent" strokeWidth={1.8} />
          <h3 className="label">处理参数</h3>
        </div>
        {detectedBgColor && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-fg-dim">
            <span
              className="w-3 h-3 rounded-sm border border-ink-600"
              style={{
                backgroundColor: `rgb(${detectedBgColor.r}, ${detectedBgColor.g}, ${detectedBgColor.b})`,
              }}
            />
            <span>{rgbToHex(detectedBgColor)}</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* 背景模式 */}
        <section>
          <div className="label mb-2.5">背景模式</div>
          <div className="grid grid-cols-3 gap-1.5">
            <ModeButton
              active={options.bgMode === "auto"}
              onClick={() => updateBgMode("auto")}
              icon={<Wand2 size={13} strokeWidth={1.8} />}
              label="自动"
            />
            <ModeButton
              active={options.bgMode === "picker"}
              onClick={() => updateBgMode("picker")}
              icon={<Pipette size={13} strokeWidth={1.8} />}
              label="吸取"
            />
            <ModeButton
              active={options.bgMode === "transparent"}
              onClick={() => updateBgMode("transparent")}
              icon={<Eye size={13} strokeWidth={1.8} />}
              label="已透明"
            />
          </div>
          {options.bgMode === "picker" && (
            <div className="mt-3 flex items-center gap-2 animate-fade-in">
              <button
                type="button"
                onClick={onPickColor}
                className={`btn-ghost h-9 px-3 text-xs ${
                  isPicking ? "border-accent text-accent shadow-glow" : ""
                }`}
              >
                <Pipette size={13} strokeWidth={1.8} />
                {isPicking ? "点击图片选色..." : "从图中吸取"}
              </button>
              <div className="flex-1 flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-md border border-ink-600"
                  style={{
                    backgroundColor: options.bgColor
                      ? `rgb(${options.bgColor.r}, ${options.bgColor.g}, ${options.bgColor.b})`
                      : "#fff",
                  }}
                />
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => updateHex(e.target.value)}
                  className="input flex-1 font-mono text-xs h-9"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          )}
        </section>

        {/* 容差 */}
        <Slider
          label="颜色容差"
          icon={<Square size={12} strokeWidth={1.8} />}
          value={options.tolerance}
          min={0}
          max={100}
          unit=""
          onChange={(v) => setOptions({ tolerance: v })}
          hint="容差越大，去背景范围越广（颜色距离阈值 0-180）"
        />

        {/* 连通去背景 */}
        <section>
          <button
            type="button"
            onClick={() => setOptions({ contiguous: !options.contiguous })}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="label">连通去背景（保留内部）</span>
              <span className="text-[10px] text-fg-dim leading-snug text-left">
                {options.contiguous
                  ? "从图片边缘洪水填充，仅移除外围背景，保留角色内部白色（眼白/衣领）"
                  : "全局颜色匹配：所有匹配背景色的像素都被移除（含内部白色）"}
              </span>
            </div>
            <span
              className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ml-3 ${
                options.contiguous ? "bg-accent" : "bg-ink-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-ink-950 transition-transform ${
                  options.contiguous ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>
        </section>

        {/* 最小元素尺寸 */}
        <Slider
          label="最小元素面积"
          icon={<Ruler size={12} strokeWidth={1.8} />}
          value={options.minElementSize}
          min={4}
          max={2000}
          step={4}
          unit="px"
          onChange={(v) => setOptions({ minElementSize: v })}
          hint="拆分元素时过滤掉小于该像素数的孤立区域（噪点/杂色块）。值越大，越能忽略小斑点；但过大可能丢失细节元素。仅在拆分多元素时生效，对单角色抠图无影响"
        />

        {/* Padding */}
        <Slider
          label="外边距 Padding"
          icon={<Square size={12} strokeWidth={1.8} />}
          value={options.padding}
          min={0}
          max={40}
          unit="px"
          onChange={(v) => setOptions({ padding: v })}
          hint="拆分元素时，每个裁剪框向外扩展的透明像素边距。值越大，元素四周留白越多，避免边缘被切。仅在拆分多元素时生效，对整体预览无影响"
        />

        {/* 抗锯齿 */}
        <section>
          <button
            type="button"
            onClick={() => setOptions({ antiAlias: !options.antiAlias })}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <span className="label">边缘抗锯齿</span>
            </div>
            <span
              className={`relative w-9 h-5 rounded-full transition-colors ${
                options.antiAlias ? "bg-accent" : "bg-ink-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-ink-950 transition-transform ${
                  options.antiAlias ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>
        </section>

        {/* 颜色去污染（白边消除） */}
        <section>
          <button
            type="button"
            onClick={() => setOptions({ decontaminate: !options.decontaminate })}
            className="w-full flex items-center justify-between group"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="label">颜色去污染</span>
              <span className="text-[10px] text-fg-dim">消除边缘白边（推荐）</span>
            </div>
            <span
              className={`relative w-9 h-5 rounded-full transition-colors ${
                options.decontaminate ? "bg-accent" : "bg-ink-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-ink-950 transition-transform ${
                  options.decontaminate ? "translate-x-4" : ""
                }`}
              />
            </span>
          </button>
        </section>

        {/* Alpha 边缘收缩（滑块：腐蚀 px 数） */}
        <Slider
          label="Alpha 边缘收缩"
          icon={<Square size={12} strokeWidth={1.8} />}
          value={options.erodeAlpha}
          min={0}
          max={10}
          unit="px"
          onChange={(v) => setOptions({ erodeAlpha: v })}
          hint={options.erodeAlpha > 0 ? `向内腐蚀 ${options.erodeAlpha}px 彻底去白边` : "0 = 关闭（拖动设置腐蚀像素数）"}
        />
      </div>

      <footer className="p-4 border-t border-ink-700">
        <button
          type="button"
          onClick={onReprocess}
          disabled={isProcessing}
          className="btn-primary w-full h-10"
        >
          {isProcessing ? (
            <Loader2 size={15} className="animate-spin-slow" />
          ) : (
            <RefreshCw size={15} strokeWidth={1.9} />
          )}
          {isProcessing ? "处理中..." : "重新处理"}
        </button>
      </footer>
    </aside>
  );
}

function ModeButton({
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
      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs transition-all ${
        active
          ? "border-accent bg-accent/10 text-accent shadow-glow"
          : "border-ink-700 text-fg-muted hover:border-ink-600 hover:text-fg"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Slider({
  label,
  icon,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-fg-muted">
          {icon}
          <span className="label">{label}</span>
        </div>
        <span className="font-mono text-xs text-fg bg-ink-950 px-2 py-0.5 rounded-md border border-ink-700">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {hint && <p className="mt-1.5 text-[11px] text-fg-dim leading-snug">{hint}</p>}
    </section>
  );
}
