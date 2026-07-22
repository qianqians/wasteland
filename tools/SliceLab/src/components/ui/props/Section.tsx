// UI 属性面板：分组标题
export default function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-wider text-fg-dim font-mono mb-1.5 px-1">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
