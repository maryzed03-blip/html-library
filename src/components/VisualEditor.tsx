import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Component, Folder } from "@/lib/library-db";
import { folderPath } from "@/lib/use-library";

type Selection = {
  vid: string;
  tag: string;
  text: string;
  isText: boolean;
  isImage: boolean;
  isLink: boolean;
  src: string;
  href: string;
  styles: Record<string, string>;
};

const STYLE_KEYS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "color",
  "textAlign",
  "lineHeight",
  "letterSpacing",
  "margin",
  "padding",
  "background",
  "backgroundColor",
  "border",
  "borderRadius",
  "width",
  "height",
  "opacity",
  "display",
  "gap",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "position",
  "top",
  "left",
  "zIndex",
] as const;


const bridge = `
(function(){
  var sel=null; var moveMode=false; var drag=null; var t=null;
  function ensureIds(){
    var i=0;
    document.body.querySelectorAll('*').forEach(function(el){
      if(!el.getAttribute('data-vid')) el.setAttribute('data-vid','v'+(i++)+'-'+Math.random().toString(36).slice(2,7));
    });
  }
  var style=document.createElement('style');
  style.setAttribute('data-vid-style','1');
  style.textContent='[data-vid-hover]{outline:1px dashed rgba(99,102,241,.8)!important;outline-offset:1px}[data-vid-selected]{outline:2px solid #6366f1!important;outline-offset:1px}[data-vid-drop-before]{box-shadow:0 -3px 0 0 #22d3ee inset!important}[data-vid-drop-after]{box-shadow:0 3px 0 0 #22d3ee inset!important}body.vid-move *{cursor:grab!important}';
  document.head.appendChild(style);
  var KEYS=${JSON.stringify(STYLE_KEYS)};
  function info(el){
    var cs=getComputedStyle(el); var s={};
    KEYS.forEach(function(k){ s[k]=cs[k]||''; });
    var leaf=el.children.length===0;
    return {
      vid: el.getAttribute('data-vid'),
      tag: el.tagName.toLowerCase(),
      text: leaf? (el.textContent||'') : '',
      isText: leaf,
      isImage: el.tagName==='IMG',
      isLink: el.tagName==='A',
      src: el.getAttribute('src')||'',
      href: el.getAttribute('href')||'',
      styles: s
    };
  }
  function exportHtml(auto){
    var clone=document.body.cloneNode(true);
    clone.querySelectorAll('script[data-vid-bridge],style[data-vid-style]').forEach(function(x){x.remove();});
    clone.querySelectorAll('[data-vid]').forEach(function(x){
      x.removeAttribute('data-vid'); x.removeAttribute('data-vid-hover'); x.removeAttribute('data-vid-selected');
      x.removeAttribute('data-vid-drop-before'); x.removeAttribute('data-vid-drop-after'); x.removeAttribute('draggable');
      if(x.getAttribute('style')==='') x.removeAttribute('style');
    });
    parent.postMessage({source:'vedit', type:'export', html: clone.innerHTML, auto: !!auto}, '*');
  }
  function changed(){ clearTimeout(t); t=setTimeout(function(){ exportHtml(true); }, 400); }
  function find(vid){ return document.querySelector('[data-vid="'+vid+'"]'); }
  function clearDrop(){
    document.querySelectorAll('[data-vid-drop-before],[data-vid-drop-after]').forEach(function(x){
      x.removeAttribute('data-vid-drop-before'); x.removeAttribute('data-vid-drop-after');
    });
  }
  function select(el){
    if(sel) sel.removeAttribute('data-vid-selected');
    sel=el; sel.setAttribute('data-vid-selected','1');
    parent.postMessage({source:'vedit', type:'select', payload: info(el)}, '*');
  }
  document.addEventListener('mouseover', function(e){
    var x=e.target; if(!(x instanceof Element)) return;
    document.querySelectorAll('[data-vid-hover]').forEach(function(n){n.removeAttribute('data-vid-hover');});
    x.setAttribute('data-vid-hover','1');
  }, true);
  document.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    var x=e.target; if(!(x instanceof Element)) return;
    select(x);
  }, true);
  document.addEventListener('mousedown', function(e){
    if(!moveMode) return;
    var x=e.target; if(!(x instanceof Element)) return;
    if(x===document.body) return;
    x.setAttribute('draggable','true');
  }, true);
  document.addEventListener('dragstart', function(e){
    if(!moveMode){ e.preventDefault(); return; }
    var x=e.target; if(!(x instanceof Element)) return;
    drag=x; e.stopPropagation();
    try{ e.dataTransfer.setData('text/plain','x'); e.dataTransfer.effectAllowed='move'; }catch(_){}
  }, true);
  document.addEventListener('dragover', function(e){
    if(!drag) return;
    e.preventDefault();
    var x=e.target; if(!(x instanceof Element)) return;
    if(x===drag || drag.contains(x)) return;
    clearDrop();
    var r=x.getBoundingClientRect();
    var after=(e.clientY-r.top)>r.height/2;
    x.setAttribute(after?'data-vid-drop-after':'data-vid-drop-before','1');
  }, true);
  document.addEventListener('drop', function(e){
    if(!drag) return;
    e.preventDefault(); e.stopPropagation();
    var x=e.target;
    if(x instanceof Element && x!==drag && !drag.contains(x)){
      var r=x.getBoundingClientRect();
      var after=(e.clientY-r.top)>r.height/2;
      if(x.parentNode){ after? x.parentNode.insertBefore(drag, x.nextSibling) : x.parentNode.insertBefore(drag, x); }
    }
    clearDrop(); drag.removeAttribute('draggable'); select(drag); drag=null; changed();
  }, true);
  document.addEventListener('dragend', function(){ clearDrop(); if(drag){drag.removeAttribute('draggable');} drag=null; }, true);
  window.addEventListener('message', function(e){
    var d=e.data; if(!d||d.source!=='vhost') return;
    var el = d.vid? find(d.vid): null;
    if(d.type==='style' && el){ el.style[d.prop]=d.value; parent.postMessage({source:'vedit',type:'select',payload:info(el)},'*'); changed(); }
    if(d.type==='text' && el){ el.textContent=d.value; changed(); }
    if(d.type==='attr' && el){ if(d.value) el.setAttribute(d.name,d.value); else el.removeAttribute(d.name); changed(); }
    if(d.type==='remove' && el){ el.remove(); sel=null; parent.postMessage({source:'vedit',type:'removed'},'*'); changed(); }
    if(d.type==='moveMode'){ moveMode=!!d.value; document.body.classList.toggle('vid-move', moveMode); }
    if(d.type==='nudge' && el){
      var p=el.parentNode; if(!p) return;
      if(d.dir==='up' && el.previousElementSibling) p.insertBefore(el, el.previousElementSibling);
      if(d.dir==='down' && el.nextElementSibling) p.insertBefore(el.nextElementSibling, el);
      if(d.dir==='out' && p!==document.body && p.parentNode) p.parentNode.insertBefore(el, p.nextSibling);
      select(el); changed();
    }
    if(d.type==='export'){ exportHtml(false); }
  });
  ensureIds();
  parent.postMessage({source:'vedit', type:'ready'}, '*');
})();
`;

function docFor(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<style>html,body{margin:0;padding:0;background:#fff;}</style>
</head><body>${html}<script data-vid-bridge="1">${bridge}<\/script></body></html>`;
}


export function VisualEditor({
  item,
  onClose,
  onSave,
  folders,
  onMove,
  onDeleteComponent,
  extraHeader,
}: {
  item: Component | null;
  onClose: () => void;
  onSave: (html: string) => void;
  folders?: Folder[];
  onMove?: (folderId: string | null) => void;
  onDeleteComponent?: () => void;
  extraHeader?: ReactNode;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [mode, setMode] = useState<"visual" | "code">("visual");
  const [html, setHtml] = useState("");
  const [sel, setSel] = useState<Selection | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [frameHtml, setFrameHtml] = useState("");

  useEffect(() => {
    if (item) {
      setHtml(item.html);
      setFrameHtml(item.html);
      setSel(null);
      setMode("visual");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const post = useCallback((msg: Record<string, unknown>) => {
    frame.current?.contentWindow?.postMessage({ source: "vhost", ...msg }, "*");
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { source?: string; type?: string; payload?: Selection; html?: string };
      if (d?.source !== "vedit") return;
      if (d.type === "select" && d.payload) setSel(d.payload);
      if (d.type === "removed") setSel(null);
      if (d.type === "export" && typeof d.html === "string") {
        setHtml(d.html);
        if (pendingSave) {
          setPendingSave(false);
          onSave(d.html);
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onSave, pendingSave]);

  const srcDoc = useMemo(() => docFor(frameHtml), [frameHtml]);

  if (!item) return null;

  const setStyle = (prop: string, value: string) => {
    if (!sel) return;
    setSel({ ...sel, styles: { ...sel.styles, [prop]: value } });
    post({ type: "style", vid: sel.vid, prop, value });
  };

  const toHex = (v: string) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v || "");
    if (!m) return /^#/.test(v) ? v : "#000000";
    return (
      "#" +
      [m[1], m[2], m[3]]
        .map((n) => Number(n).toString(16).padStart(2, "0"))
        .join("")
    );
  };

  const Field = ({
    label,
    prop,
    type = "text",
    options,
  }: {
    label: string;
    prop: string;
    type?: string;
    options?: string[];
  }) => (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {options ? (
        <select
          value={sel?.styles[prop] ?? ""}
          onChange={(e) => setStyle(prop, e.target.value)}
          className="w-full rounded-lg border border-border bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:border-primary"
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-card">
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          defaultValue={
            type === "color" ? toHex(sel?.styles[prop] ?? "") : (sel?.styles[prop] ?? "")
          }
          key={`${sel?.vid}-${prop}`}
          onChange={(e) => setStyle(prop, e.target.value)}
          className={`w-full rounded-lg border border-border bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:border-primary ${
            type === "color" ? "h-8 p-1" : ""
          }`}
        />
      )}
    </label>
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-ink">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ← Πίσω
          </button>
          <h2 className="font-display text-sm font-semibold">{item.name}</h2>
          {extraHeader}
        </div>
        <div className="flex items-center gap-2">
          {folders && onMove && (
            <select
              value={item.folderId ?? ""}
              onChange={(e) => onMove(e.target.value || null)}
              title="Μετακίνηση σε φάκελο"
              className="max-w-44 rounded-lg border border-border bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              <option value="" className="bg-card">
                📁 Χωρίς φάκελο
              </option>
              {folders.map((f) => (
                <option key={f.id} value={f.id} className="bg-card">
                  {folderPath(folders, f.id).join(" / ")}
                </option>
              ))}
            </select>
          )}
          {onDeleteComponent && (
            <button
              onClick={onDeleteComponent}
              className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive"
            >
              🗑 Διαγραφή
            </button>
          )}
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {(["visual", "code"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (m === "code" && mode === "visual") post({ type: "export" });
                  if (m === "visual" && mode === "code") {
                    setFrameHtml(html);
                    setSel(null);
                  }
                  setMode(m);
                }}
                className={`rounded-md px-3 py-1 ${
                  mode === m ? "bg-primary/20 text-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "visual" ? "VISUAL" : "CODE"}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(html);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            Copy Code
          </button>
          <button
            onClick={() => {
              if (mode === "visual") {
                setPendingSave(true);
                post({ type: "export" });
              } else onSave(html);
            }}
            className="rounded-lg bg-gradient-to-r from-brand to-cyanx px-4 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Αποθήκευση
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto bg-ink2 p-4">
          {mode === "visual" ? (
            <iframe
              ref={frame}
              title="visual-editor"
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              className="h-full min-h-[600px] w-full rounded-xl border border-border bg-white"
            />
          ) : (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              spellCheck={false}
              className="h-full min-h-[600px] w-full rounded-xl border border-border bg-ink p-3 font-mono text-xs leading-relaxed outline-none focus:border-primary"
            />
          )}
        </div>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-foreground/[0.03] p-4">
          {mode === "code" ? (
            <p className="text-xs text-muted-foreground">
              Επεξεργάζεσαι κώδικα. Πάτα VISUAL για να δεις τις αλλαγές.
            </p>
          ) : !sel ? (
            <p className="text-xs text-muted-foreground">
              Κάνε κλικ σε ένα στοιχείο μέσα στο preview για να το επεξεργαστείς.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.15em] text-accent">
                  &lt;{sel.tag}&gt;
                </p>
                <button
                  onClick={() => post({ type: "remove", vid: sel.vid })}
                  className="rounded-lg border border-destructive/40 px-2 py-1 text-[11px] text-destructive"
                >
                  🗑 Διαγραφή στοιχείου
                </button>
              </div>

              {sel.isText && (
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                    Κείμενο
                  </span>
                  <textarea
                    key={sel.vid}
                    defaultValue={sel.text}
                    rows={2}
                    onChange={(e) => post({ type: "text", vid: sel.vid, value: e.target.value })}
                    className="w-full rounded-lg border border-border bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </label>
              )}

              {sel.isImage && (
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                    Image URL
                  </span>
                  <input
                    key={`${sel.vid}-src`}
                    defaultValue={sel.src}
                    onChange={(e) =>
                      post({ type: "attr", vid: sel.vid, name: "src", value: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </label>
              )}

              {sel.isLink && (
                <label className="block">
                  <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                    Link (href)
                  </span>
                  <input
                    key={`${sel.vid}-href`}
                    defaultValue={sel.href}
                    onChange={(e) =>
                      post({ type: "attr", vid: sel.vid, name: "href", value: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Field label="Font" prop="fontFamily" />
                <Field label="Μέγεθος" prop="fontSize" />
                <Field label="Βάρος" prop="fontWeight" />
                <Field
                  label="Στοίχιση"
                  prop="textAlign"
                  options={["", "left", "center", "right", "justify"]}
                />
                <Field label="Line height" prop="lineHeight" />
                <Field label="Letter spacing" prop="letterSpacing" />
                <Field label="Χρώμα" prop="color" type="color" />
                <Field label="Background" prop="backgroundColor" type="color" />
                <Field label="Padding" prop="padding" />
                <Field label="Margin" prop="margin" />
                <Field label="Width" prop="width" />
                <Field label="Height" prop="height" />
                <Field label="Border" prop="border" />
                <Field label="Radius" prop="borderRadius" />
                <Field label="Opacity" prop="opacity" />
                <Field label="Gap" prop="gap" />
              </div>

              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-wide text-muted-foreground">
                  Background (πλήρες)
                </span>
                <input
                  key={`${sel.vid}-bg`}
                  defaultValue={sel.styles["background"] ?? ""}
                  onChange={(e) => setStyle("background", e.target.value)}
                  className="w-full rounded-lg border border-border bg-foreground/5 px-2 py-1.5 text-xs outline-none focus:border-primary"
                />
              </label>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
