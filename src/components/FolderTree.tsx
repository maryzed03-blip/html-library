import { useState } from "react";
import type { Folder } from "@/lib/library-db";

type Props = {
  folders: Folder[];
  counts: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (parentId: string | null) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDropComponent: (componentId: string, folderId: string | null) => void;
};

function Node({
  folder,
  depth,
  ...p
}: Props & { folder: Folder; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const [dragOver, setDragOver] = useState(false);
  const children = p.folders.filter((f) => f.parentId === folder.id);
  const active = p.selectedId === folder.id;

  return (
    <div>
      <div
        onClick={() => p.onSelect(folder.id)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const id = e.dataTransfer.getData("text/component-id");
          if (id) p.onDropComponent(id, folder.id);
        }}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={`group flex cursor-pointer items-center gap-1.5 rounded-lg py-2 pr-2 text-sm transition ${
          active
            ? "border border-primary/30 bg-primary/15 text-foreground"
            : "border border-transparent text-foreground/70 hover:bg-foreground/5"
        } ${dragOver ? "ring-1 ring-accent" : ""}`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="w-3 shrink-0 text-[10px] text-muted-foreground"
        >
          {children.length ? (open ? "▾" : "▸") : "·"}
        </button>
        <span className="truncate">{folder.name}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {p.counts[folder.id] ?? 0}
        </span>
        <span className="hidden shrink-0 gap-1 group-hover:flex">
          <button
            title="Νέος υποφάκελος"
            onClick={(e) => {
              e.stopPropagation();
              p.onCreate(folder.id);
            }}
            className="text-xs text-muted-foreground hover:text-accent"
          >
            +
          </button>
          <button
            title="Μετονομασία"
            onClick={(e) => {
              e.stopPropagation();
              p.onRename(folder.id);
            }}
            className="text-[10px] text-muted-foreground hover:text-accent"
          >
            ✎
          </button>
          <button
            title="Διαγραφή"
            onClick={(e) => {
              e.stopPropagation();
              p.onDelete(folder.id);
            }}
            className="text-[10px] text-muted-foreground hover:text-destructive"
          >
            ✕
          </button>
        </span>
      </div>
      {open &&
        children.map((c) => <Node key={c.id} {...p} folder={c} depth={depth + 1} />)}
    </div>
  );
}

export function FolderTree(props: Props) {
  const roots = props.folders.filter((f) => f.parentId === null);
  return (
    <div className="space-y-0.5">
      <div
        onClick={() => props.onSelect(null)}
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          props.selectedId === null
            ? "border border-primary/30 bg-primary/15"
            : "border border-transparent text-foreground/70 hover:bg-foreground/5"
        }`}
      >
        Όλα τα components
      </div>
      {roots.map((f) => (
        <Node key={f.id} {...props} folder={f} depth={0} />
      ))}
      <button
        onClick={() => props.onCreate(null)}
        className="mt-2 w-full rounded-lg border border-border py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
      >
        + Νέος φάκελος
      </button>
    </div>
  );
}
