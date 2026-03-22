import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Match installed pdfjs-dist (via react-pdf). CDN worker avoids Vite/pnpm worker path issues.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

type Props = { fileUrl: string };

/**
 * Renders PDF with PDF.js (no browser plugin). Avoids Chrome/Edge Drive, download, and print toolbar
 * inside the embedded viewer. Not DRM: users can still use browser menus or devtools.
 */
export function CoursePdfJsViewer({ fileUrl }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(720);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(280, Math.min(el.clientWidth - 16, 1200)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onLoadSuccess = useCallback((info: { numPages: number }) => {
    setNumPages(info.numPages);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[70vh] overflow-y-auto overflow-x-hidden rounded-lg bg-neutral-300 border-4 border-green-500"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onLoadSuccess}
        loading={
          <div className="flex min-h-[40vh] items-center justify-center text-neutral-700">Loading document…</div>
        }
        error={
          <div className="flex min-h-[40vh] items-center justify-center px-4 text-center text-red-700">
            Could not load this PDF. Try again or contact support.
          </div>
        }
        className="flex flex-col items-center gap-3 py-4"
      >
        {numPages > 0
          ? Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg bg-white"
              />
            ))
          : null}
      </Document>
    </div>
  );
}
