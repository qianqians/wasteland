// UI 属性面板：文本输入
export default function PropInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <label className="text-[11px] text-fg-muted w-14 shrink-0">{label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-ink-950 border border-ink-700 rounded px-2 py-1 text-[11px] text-fg outline-none focus:border-accent/60 min-w-0"
      />
    </div>
  );
}
