// UI 属性面板：颜色输入
import { useEffect, useState } from "react";

export default function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => {
    setText(value ?? "");
  }, [value]);
  const swatchColor = /^#[0-9a-fA-F]{3,8}$/.test(text) ? text : "#000000";
  return (
    <div className="flex items-center gap-1.5 px-1">
      <label className="text-[11px] text-fg-muted w-14 shrink-0">{label}</label>
      <input
        type="color"
        value={swatchColor}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        className="w-7 h-6 bg-transparent border border-ink-700 rounded cursor-pointer p-0"
      />
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="#ffffff"
        className="flex-1 bg-ink-950 border border-ink-700 rounded px-2 py-1 text-[11px] text-fg outline-none focus:border-accent/60 min-w-0 font-mono"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            onChange("");
          }}
          className="text-fg-dim hover:text-danger text-[10px]"
          title="清除"
        >
          清除
        </button>
      )}
    </div>
  );
}
