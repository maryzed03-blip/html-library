import { useState } from "react";
import type { Component, Folder } from "@/lib/library-db";
import { folderPath } from "@/lib/use-library";
import { HtmlThumb } from "./HtmlThumb";

type Props = {
  item: Component;
  path: string;
  onCopy: (item: Component) => void;
  onPreview: (item: Component) => void;
  onVisualEdit: (item: Component) => void;
  onEdit: (item: Component) => void;
  onDuplicate: (item: Component) => void;
  onDelete: (item: Component) => void;
  onToggleFavorite: (item: Component) => void;
  folders: Folder[];
  onMove: (item: Component, folderId: string | null) => void;
};

export function ComponentCard({ item, path, folders, ...on }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    on.onCopy(item);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/component-id", item.id)}
      className="group overflow-hidden rounded-2xl border border-border bg-foreground/[0.04] backdrop-blur-xl transition hover:border-primary/40"
    >
      <div className="relative">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="aspect-[16/10] w-full bg-ink2 object-cover"
          />
        ) : item.html.trim() ? (
          <HtmlThumb html={item.html} className="aspect-[16/10] w-full" />
        ) : (
          <div className="grid aspect-[16/10] w-full place-items-center bg-ink2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Χωρίς preview
          </div>
        )}
        <button
          onClick={() => on.onToggleFavorite(item)}
          title="Αγαπημένο"
          className={`absolute left-2 top-2 rounded-md border border-border bg-ink/60 px-1.5 py-0.5 text-[11px] ${
            item.favorite ? "text-accent" : "text-foreground/50 opacity-0 group-hover:opacity-100"
          }`}
        >
          {item.favorite ? "★" : "☆"}
        </button>
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => on.onPreview(item)}
            title="Preview"
            className="rounded-md border border-border bg-ink/70 px-1.5 py-0.5 text-[11px]"
          >
            👁
          </button>
          <button
            onClick={() => on.onVisualEdit(item)}
            title="Visual editor"
            className="rounded-md border border-border bg-ink/70 px-1.5 py-0.5 text-[11px]"
          >
            🎨
          </button>
          <button
            onClick={() => on.onEdit(item)}
            title="Επεξεργασία"
            className="rounded-md border border-border bg-ink/70 px-1.5 py-0.5 text-[11px]"
          >
            ✎
          </button>
          <button
            onClick={() => on.onDuplicate(item)}
            title="Διπλότυπο"
            className="rounded-md border border-border bg-ink/70 px-1.5 py-0.5 text-[11px]"
          >
            ⧉
          </button>
          <button
            onClick={() => on.onDelete(item)}
            title="Διαγραφή"
            className="rounded-md border border-border bg-ink/70 px-1.5 py-0.5 text-[11px] text-destructive"
          >
            🗑
          </button>
        </div>
      </div>
      <div className="p-3.5">
        <p className="truncate font-display text-sm font-medium">{item.name}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{path}</p>
        <select
          value={item.folderId ?? ""}
          onChange={(e) => on.onMove(item, e.target.value || null)}
          title="Μετακίνηση σε φάκελο"
          className="mt-2 w-full rounded-lg border border-border bg-foreground/5 px-2 py-1 text-[11px] outline-none focus:border-primary"
        >
          <option value="" className="bg-card">
            📁 Μετακίνηση σε… (χωρίς φάκελο)
          </option>
          {folders.map((f) => (
            <option key={f.id} value={f.id} className="bg-card">
              {folderPath(folders, f.id).join(" / ")}
            </option>
          ))}
        </select>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-1">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded border border-accent/20 bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent"
              >
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={() => on.onVisualEdit(item)}
            className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-[11px] text-foreground/80"
          >
            Edit
          </button>
          <button
            onClick={copy}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
              copied
                ? "bg-accent text-accent-foreground"
                : "bg-gradient-to-r from-brand to-cyanx text-primary-foreground"
            }`}
          >
            {copied ? "Αντιγράφηκε ✓" : "Copy Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
