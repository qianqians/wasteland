// UI 属性面板：多行文本
export default function PropTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="px-1">
      <label className="text-[11px] text-fg-muted block mb-1">{label}</label>
      <textarea
        value={value ?? ""}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ink-950 border border-ink-700 rounded px-2 py-1 text-[11px] text-fg outline-none focus:border-accent/60 resize-y"
      />
    </div>
  );
}
