// UI 属性面板：数字输入
import { useEffect, useState } from "react";

export default function PropNumber({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [text, setText] = useState<string>(value !== undefined ? String(value) : "");
  useEffect(() => {
    setText(value !== undefined ? String(value) : "");
  }, [value]);
  return (
    <div className="flex items-center gap-1.5 px-1">
      <label className="text-[11px] text-fg-muted w-14 shrink-0">{label}</label>
      <input
        type="number"
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className="flex-1 bg-ink-950 border border-ink-700 rounded px-2 py-1 text-[11px] text-fg outline-none focus:border-accent/60 min-w-0"
      />
    </div>
  );
}
