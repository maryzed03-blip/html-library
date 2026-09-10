import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ComponentCard } from "@/components/ComponentCard";
import { ComponentDialog } from "@/components/ComponentDialog";
import { PreviewDialog } from "@/components/PreviewDialog";
import { VisualEditor } from "@/components/VisualEditor";
import { FolderTree } from "@/components/FolderTree";
import { uid, type Component } from "@/lib/library-db";
import { descendantIds, folderPath, useLibrary } from "@/lib/use-library";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HTML Library — Cloud βιβλιοθήκη HTML components" },
      {
        name: "description",
        content:
          "Προσωπική cloud βιβλιοθήκη HTML components με Firebase, PNG previews, φακέλους, tags και άμεσο Copy Code.",
      },
      { property: "og:title", content: "HTML Library — Cloud βιβλιοθήκη components" },
      {
        property: "og:description",
        content: "Αποθήκευσε HTML sections με PNG preview και αντίγραψε τον κώδικα με ένα κλικ.",
      },
    ],
  }),
  component: LibraryPage,
});

type SortKey = "name" | "date";

function LibraryPage() {
  const { user, signOut } = useAuth();
  const lib = useLibrary(user?.uid ?? null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Component | null>(null);
  const [previewing, setPreviewing] = useState<Component | null>(null);
  const [visualItem, setVisualItem] = useState<Component | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of lib.folders) {
      const ids = descendantIds(lib.folders, f.id);
      map[f.id] = lib.components.filter((c) => c.folderId && ids.has(c.folderId)).length;
    }
    return map;
  }, [lib.folders, lib.components]);

  const allTags = useMemo(
    () => Array.from(new Set(lib.components.flatMap((c) => c.tags))).sort(),
    [lib.components],
  );

  const visible = useMemo(() => {
    const scope = selectedFolder ? descendantIds(lib.folders, selectedFolder) : null;
    const q = query.trim().toLowerCase();
    return lib.components
      .filter((c) => (scope ? c.folderId && scope.has(c.folderId) : true))
      .filter((c) => (onlyFavorites ? c.favorite : true))
      .filter((c) => (activeTag ? c.tags.includes(activeTag) : true))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.html.toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name, "el") : b.updatedAt - a.updatedAt,
      );
  }, [lib.components, lib.folders, selectedFolder, query, onlyFavorites, activeTag, sort]);

  const recent = useMemo(
    () =>
      lib.components
        .filter((c) => c.lastUsedAt)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
        .slice(0, 6),
    [lib.components],
  );

  const copy = (item: Component) => {
    void navigator.clipboard.writeText(item.html);
    void lib.saveComponent({ ...item, lastUsedAt: Date.now() });
    notify("Ο κώδικας αντιγράφηκε");
  };

  const breadcrumb = selectedFolder
    ? folderPath(lib.folders, selectedFolder).join(" / ")
    : "Όλα τα components";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] animate-aur rounded-full bg-brand/40 blur-[120px]" />
        <div className="absolute right-0 top-40 h-[460px] w-[460px] animate-aur-slow rounded-full bg-cyanx/30 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] animate-aur rounded-full bg-rosex/25 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-6">
        {lib.error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            Firebase: {lib.error}
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-cyanx font-display font-bold text-primary-foreground">
              🌳
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold leading-none">HTML Library</h1>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Cloud βιβλιοθήκη components · συγχρονισμός με Firebase
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex w-72 items-center gap-2 rounded-xl border border-border bg-foreground/5 px-3 py-2">
              <span className="text-sm text-muted-foreground">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Αναζήτηση components…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Link
              to="/scratch"
              className="rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm text-foreground/80"
            >
              ✏️ Πρόχειρο
            </Link>
            <button
              onClick={() => void signOut()}
              className="rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm text-foreground/80"
              title={user?.email ?? ""}
            >
              Αποσύνδεση
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="rounded-xl bg-gradient-to-r from-brand to-cyanx px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-brand/20"
            >
              + New HTML
            </button>
          </div>
        </div>

        <div className="flex items-start gap-6">
          <aside className="hidden w-64 shrink-0 rounded-2xl border border-border bg-foreground/[0.04] p-4 backdrop-blur-xl lg:block">
            <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Βιβλιοθήκη
            </p>
            <FolderTree
              folders={lib.folders}
              counts={counts}
              selectedId={selectedFolder}
              onSelect={setSelectedFolder}
              onCreate={(parentId) => {
                const name = window.prompt("Όνομα φακέλου");
                if (name?.trim()) void lib.createFolder(name.trim(), parentId);
              }}
              onRename={(id) => {
                const cur = lib.folders.find((f) => f.id === id);
                const name = window.prompt("Νέο όνομα", cur?.name ?? "");
                if (name?.trim()) void lib.renameFolder(id, name.trim());
              }}
              onDelete={(id) => {
                if (window.confirm("Διαγραφή φακέλου; Τα components θα μείνουν χωρίς φάκελο."))
                  void lib.deleteFolder(id);
              }}
              onDropComponent={(componentId, folderId) => {
                const c = lib.components.find((x) => x.id === componentId);
                if (c) void lib.saveComponent({ ...c, folderId, updatedAt: Date.now() });
              }}
            />

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                Γρήγορη πρόσβαση
              </p>
              <button
                onClick={() => setOnlyFavorites((v) => !v)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  onlyFavorites ? "bg-primary/15 text-foreground" : "text-foreground/70"
                }`}
              >
                ⭐ Favorites
              </button>
              <div className="mt-2 flex flex-wrap gap-1 px-2">
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTag((cur) => (cur === t ? null : t))}
                    className={`rounded border px-1.5 py-0.5 text-[10px] ${
                      activeTag === t
                        ? "border-accent bg-accent/20 text-accent"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold">{breadcrumb}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {visible.length} components
                  {activeTag ? ` · tag: ${activeTag}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(["name", "date"] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`rounded-lg border px-3 py-1.5 text-xs ${
                      sort === k
                        ? "border-primary/40 bg-primary/15 text-foreground"
                        : "border-border bg-foreground/5 text-foreground/70"
                    }`}
                  >
                    {k === "name" ? "Όνομα ↓" : "Ημερομηνία"}
                  </button>
                ))}
              </div>
            </div>

            {recent.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  📌 Πρόσφατα
                </p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recent.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => copy(c)}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-foreground/5 py-1 pl-1 pr-3"
                    >
                      {c.image ? (
                        <img src={c.image} alt="" className="size-7 rounded-md object-cover" />
                      ) : (
                        <span className="size-7 rounded-md bg-ink2" />
                      )}
                      <span className="max-w-32 truncate text-xs">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {visible.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
                <p className="font-display text-sm">
                  {lib.ready ? "Δεν υπάρχουν components εδώ ακόμη" : "Φόρτωση…"}
                </p>
                <button
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                  className="mt-3 rounded-xl bg-gradient-to-r from-brand to-cyanx px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  + New HTML
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((c) => (
                  <ComponentCard
                    key={c.id}
                    item={c}
                    path={folderPath(lib.folders, c.folderId).join(" / ") || "—"}
                    folders={lib.folders}
                    onMove={(citem, folderId) => {
                      void lib.saveComponent({ ...citem, folderId, updatedAt: Date.now() });
                      notify("Μετακινήθηκε");
                    }}
                    onCopy={copy}
                    onPreview={setPreviewing}
                    onVisualEdit={setVisualItem}
                    onEdit={(item) => {
                      setEditing(item);
                      setDialogOpen(true);
                    }}
                    onDuplicate={(item) => {
                      void lib.saveComponent({
                        ...item,
                        id: uid(),
                        name: `${item.name} (copy)`,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                      });
                      notify("Δημιουργήθηκε διπλότυπο");
                    }}
                    onDelete={(item) => {
                      if (window.confirm(`Διαγραφή «${item.name}»;`))
                        void lib.deleteComponent(item.id);
                    }}
                    onToggleFavorite={(item) =>
                      void lib.saveComponent({ ...item, favorite: !item.favorite })
                    }
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ComponentDialog
        open={dialogOpen}
        folders={lib.folders}
        initial={editing}
        defaultFolderId={selectedFolder}
        onClose={() => setDialogOpen(false)}
        onSave={(data) => {
          const now = Date.now();
          void lib.saveComponent({
            id: editing?.id ?? uid(),
            favorite: editing?.favorite ?? false,
            createdAt: editing?.createdAt ?? now,
            lastUsedAt: editing?.lastUsedAt ?? null,
            updatedAt: now,
            ...data,
          });
          setDialogOpen(false);
          notify(editing ? "Αποθηκεύτηκε" : "Το component δημιουργήθηκε");
        }}
      />

      <VisualEditor
        item={visualItem}
        folders={lib.folders}
        onMove={(folderId) => {
          if (!visualItem) return;
          const next = { ...visualItem, folderId, updatedAt: Date.now() };
          void lib.saveComponent(next);
          setVisualItem(next);
          notify("Μετακινήθηκε");
        }}
        onDeleteComponent={() => {
          if (!visualItem) return;
          if (!window.confirm(`Διαγραφή «${visualItem.name}»;`)) return;
          void lib.deleteComponent(visualItem.id);
          setVisualItem(null);
          notify("Διαγράφηκε");
        }}
        onClose={() => setVisualItem(null)}
        onSave={(html) => {
          if (!visualItem) return;
          void lib.saveComponent({ ...visualItem, html, updatedAt: Date.now() });
          setVisualItem(null);
          notify("Το component αποθηκεύτηκε");
        }}
      />

      <PreviewDialog item={previewing} onClose={() => setPreviewing(null)} onCopy={copy} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-border bg-card px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
