// UI 属性面板：下拉选择
export default function PropSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number | undefined;
  options: { label: string; value: string | number }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <label className="text-[11px] text-fg-muted w-14 shrink-0">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-ink-950 border border-ink-700 rounded px-2 py-1 text-[11px] text-fg outline-none focus:border-accent/60 min-w-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
