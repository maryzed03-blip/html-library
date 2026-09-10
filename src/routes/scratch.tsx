import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { VisualEditor } from "@/components/VisualEditor";
import { uid, type Component } from "@/lib/library-db";
import { useLibrary } from "@/lib/use-library";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/scratch")({
  head: () => ({
    meta: [
      { title: "Πρόχειρος Editor — HTML Library" },
      {
        name: "description",
        content:
          "Ανεξάρτητος πρόχειρος visual editor για γρήγορες δοκιμές HTML, με άμεση διαγραφή στοιχείων και αποθήκευση σε φάκελο.",
      },
      { property: "og:title", content: "Πρόχειρος Editor — HTML Library" },
      {
        property: "og:description",
        content: "Γράψε, δοκίμασε και καθάρισε HTML πρόχειρα, πριν το αποθηκεύσεις στη βιβλιοθήκη.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScratchPage,
});

const KEY = "html-library:scratch";
const DEFAULT_HTML = `<section style="padding:64px 32px;font-family:system-ui;text-align:center">
  <h1 style="font-size:44px;margin:0 0 12px">Πρόχειρο</h1>
  <p style="color:#555;margin:0 0 24px">Γράψε ή επικόλλησε HTML και δούλεψέ το ελεύθερα.</p>
  <a href="#" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#111;color:#fff;text-decoration:none">Get started</a>
</section>`;

function ScratchPage() {
  const { user } = useAuth();
  const lib = useLibrary(user?.uid ?? null);
  const navigate = useNavigate();
  const [item, setItem] = useState<Component | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 1600);
  };

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    const now = Date.now();
    setItem({
      id: "scratch",
      name: "Πρόχειρο",
      html: saved ?? DEFAULT_HTML,
      image: null,
      folderId: null,
      tags: [],
      favorite: false,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
    });
  }, []);

  if (!item) return null;

  return (
    <>
      <VisualEditor
        item={item}
        folders={lib.folders}
        onMove={(folderId) => setItem((p) => (p ? { ...p, folderId } : p))}
        onClose={() => void navigate({ to: "/" })}
        onSave={(html) => {
          window.localStorage.setItem(KEY, html);
          setItem((p) => (p ? { ...p, html } : p));
          notify("Το πρόχειρο αποθηκεύτηκε στον browser");
        }}
        onDeleteComponent={() => {
          if (!window.confirm("Καθαρισμός προχείρου;")) return;
          window.localStorage.removeItem(KEY);
          setItem((p) => (p ? { ...p, html: DEFAULT_HTML } : p));
          notify("Το πρόχειρο καθαρίστηκε");
        }}
        extraHeader={
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              scratch
            </span>
            <button
              onClick={() => {
                const name = window.prompt("Όνομα component", "Νέο component");
                if (!name?.trim()) return;
                const now = Date.now();
                void lib.saveComponent({
                  ...item,
                  id: uid(),
                  name: name.trim(),
                  createdAt: now,
                  updatedAt: now,
                });
                notify("Αποθηκεύτηκε στη βιβλιοθήκη");
              }}
              className="rounded-lg border border-border px-2.5 py-1 text-[11px]"
            >
              ➕ Στη βιβλιοθήκη
            </button>
            <Link to="/" className="text-[11px] text-muted-foreground hover:text-foreground">
              Βιβλιοθήκη
            </Link>
          </div>
        }
      />
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-xl border border-border bg-card px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}
