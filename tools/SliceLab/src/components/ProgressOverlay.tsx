import { useImageStore } from "@/store/useImageStore";
import { Loader2 } from "lucide-react";

export default function ProgressOverlay() {
  const { progress } = useImageStore();
  const visible =
    progress.status === "processing" || progress.status === "loading";
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/40 backdrop-blur-[2px] pointer-events-none animate-fade-in">
      <div className="panel px-6 py-5 flex items-center gap-4 min-w-[280px]">
        <Loader2 size={20} className="text-accent animate-spin-slow" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-fg">{progress.message || "处理中..."}</span>
            <span className="font-mono text-xs text-accent">{progress.percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
