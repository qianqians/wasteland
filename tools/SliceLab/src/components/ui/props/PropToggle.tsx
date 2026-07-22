// UI 属性面板：开关
export default function PropToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  const on = !!value;
  return (
    <div className="flex items-center gap-1.5 px-1">
      <label className="text-[11px] text-fg-muted w-14 shrink-0">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          on ? "bg-accent" : "bg-ink-700"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-ink-950 transition-transform ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
