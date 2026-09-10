type Props = {
  html: string;
  /** Πλάτος του εικονικού viewport που αποδίδεται πριν το scaling */
  viewportWidth?: number;
  /** Ύψος του εικονικού viewport */
  viewportHeight?: number;
  /** Αν true, το ύψος του container προσαρμόζεται στο scaled περιεχόμενο */
  autoHeight?: boolean;
  className?: string;
};

/**
 * Αποδίδει το HTML σε sandboxed iframe ως αυτόματο preview,
 * όταν δεν έχει ανέβει PNG.
 */
export function HtmlThumb({
  html,
  viewportWidth = 1280,
  viewportHeight = 800,
  autoHeight = false,
  className = "",
}: Props) {
  const doc = `<!doctype html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://cdn.tailwindcss.com"></script>
<style>html,body{margin:0;padding:0;background:#fff;}</style>
</head><body>${html}</body></html>`;

  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <iframe
        title="preview"
        sandbox="allow-scripts"
        srcDoc={doc}
        scrolling="no"
        className="absolute left-0 top-0 origin-top-left border-0"
        style={{ width: viewportWidth, height: viewportHeight, pointerEvents: "none" }}
        ref={(el) => {
          if (!el) return;
          const parent = el.parentElement as HTMLElement | null;
          if (!parent) return;
          const apply = () => {
            const scale = parent.clientWidth / viewportWidth;
            el.style.transform = `scale(${scale})`;
            if (autoHeight) parent.style.height = `${viewportHeight * scale}px`;
          };
          apply();
          const ro = new ResizeObserver(apply);
          ro.observe(parent);
        }}
      />
    </div>
  );
}
