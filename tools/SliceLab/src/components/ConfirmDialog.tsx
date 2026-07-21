import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  /** 隐藏确认按钮（用于纯内容对话框） */
  hideActions?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  danger = false,
  hideActions = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm animate-fade-in p-6">
      <div className="panel max-w-md w-full p-6 shadow-panel animate-stagger">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              danger
                ? "bg-danger/10 text-danger border border-danger/30"
                : "bg-accent/10 text-accent border border-accent/30"
            }`}
          >
            <AlertTriangle size={18} strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-semibold text-fg mb-1">
              {title}
            </h3>
            {message && (
              <p className="text-sm text-fg-muted leading-relaxed">{message}</p>
            )}
          </div>
        </div>
        {children && <div className="mb-4">{children}</div>}
        {!hideActions && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost h-9 px-4 text-sm"
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                className={
                  danger
                    ? "btn-danger h-9 px-4 text-sm"
                    : "btn-primary h-9 px-4 text-sm"
                }
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
