import type { Component } from "@/lib/library-db";
import { HtmlThumb } from "./HtmlThumb";

export function PreviewDialog({
  item,
  onClose,
  onCopy,
}: {
  item: Component | null;
  onClose: () => void;
  onCopy: (item: Component) => void;
}) {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-[960px] max-w-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-sm font-semibold">{item.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCopy(item)}
              className="rounded-lg bg-gradient-to-r from-brand to-cyanx px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Copy Code
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border bg-ink2">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full object-contain" />
            ) : item.html.trim() ? (
              <HtmlThumb html={item.html} autoHeight className="w-full" />
            ) : (
              <div className="grid h-48 place-items-center text-xs text-muted-foreground">
                Χωρίς εικόνα
              </div>
            )}
          </div>
          <pre className="max-h-[60vh] overflow-auto rounded-xl border border-border bg-ink2 p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
            {item.html}
          </pre>
        </div>
      </div>
    </div>
  );
}
