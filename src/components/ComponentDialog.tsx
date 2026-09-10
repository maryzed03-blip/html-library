import { useEffect, useRef, useState } from "react";
import type { Component, Folder } from "@/lib/library-db";
import { folderPath } from "@/lib/use-library";
import { HtmlThumb } from "./HtmlThumb";

type Props = {
  open: boolean;
  folders: Folder[];
  initial: Component | null;
  defaultFolderId: string | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    html: string;
    image: string | null;
    folderId: string | null;
    tags: string[];
  }) => void;
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

async function makeFirestorePreview(file: File): Promise<string> {
  const original = await readFileAsDataURL(file);

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      // A preview is only a thumbnail. Keeping it small makes Spark/Firestore
      // practical and avoids hitting Firestore's per-document size limit.
      const maxWidth = 640;
      const maxHeight = 360;
      const scale = Math.min(
        1,
        maxWidth / Math.max(1, img.naturalWidth),
        maxHeight / Math.max(1, img.naturalHeight),
      );

      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(original);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // JPEG is intentionally used for compact Firestore preview storage.
      // If conversion fails, keep the original data URL.
      try {
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      } catch {
        resolve(original);
      }
    };

    img.onerror = () => resolve(original);
    img.src = original;
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsText(file);
  });
}

export function ComponentDialog({
  open,
  folders,
  initial,
  defaultFolderId,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [html, setHtml] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setHtml(initial?.html ?? "");
    setImage(initial?.image ?? null);
    setFolderId(initial?.folderId ?? defaultFolderId);
    setTags((initial?.tags ?? []).join(", "));
  }, [open, initial, defaultFolderId]);

  if (!open) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) setImage(await makeFirestorePreview(file));
      else if (/\.(html?|txt)$/i.test(file.name) || file.type.includes("html")) {
        setHtml(await readFileAsText(file));
        if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
      }
    }
  };

  const copyHtml = () => {
    void navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`max-h-[90vh] w-[620px] max-w-full overflow-y-auto rounded-2xl border bg-card p-5 shadow-2xl ${
          dragging ? "border-accent" : "border-border"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {initial ? "Επεξεργασία component" : "Νέο HTML component"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <label className="mb-1 block text-xs text-muted-foreground">1. Όνομα</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Hero — Black Luxury"
          className="mb-4 w-full rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <label className="mb-1 block text-xs text-muted-foreground">
          2. Εικόνα preview — προαιρετική, συμπιέζεται αυτόματα και αποθηκεύεται στο Firestore
        </label>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-ink2">
            {image ? (
              <img src={image} alt="preview" className="h-full w-full object-cover" />
            ) : html.trim() ? (
              <HtmlThumb html={html} className="h-24 w-40" />
            ) : (
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                PNG
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void handleFiles(e.target.files)}
              className="text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-foreground/10 file:px-3 file:py-1.5 file:text-xs file:text-foreground"
            />
            <input
              type="file"
              accept=".html,.htm,.txt,text/html"
              onChange={(e) => void handleFiles(e.target.files)}
              className="text-xs text-muted-foreground file:mr-2 file:rounded-lg file:border-0 file:bg-foreground/10 file:px-3 file:py-1.5 file:text-xs file:text-foreground"
            />
          </div>
        </div>

        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs text-muted-foreground">3. HTML κώδικας</label>
          <button onClick={copyHtml} className="text-[11px] text-accent hover:underline">
            {copied ? "Αντιγράφηκε ✓" : "Αντιγραφή (⌘/Ctrl+C)"}
          </button>
        </div>
        <textarea
          ref={areaRef}
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
              const el = areaRef.current;
              if (el && el.selectionStart === el.selectionEnd) {
                e.preventDefault();
                copyHtml();
              }
            }
          }}
          rows={8}
          placeholder="<section class='hero'>…</section>"
          className="mb-4 w-full rounded-xl border border-border bg-foreground/5 px-3 py-2 font-mono text-xs outline-none focus:border-primary"
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">4. Φάκελος</label>
            <select
              value={folderId ?? ""}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="w-full rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">— Χωρίς φάκελο —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} className="bg-card">
                  {folderPath(folders, f.id).join(" → ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Tags (με κόμμα)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="hero, dark"
              className="w-full rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Άκυρο
          </button>
          <button
            disabled={!name.trim() || !html.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                html,
                image,
                folderId,
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="rounded-xl bg-gradient-to-r from-brand to-cyanx px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Αποθήκευση
          </button>
        </div>
      </div>
    </div>
  );
}
