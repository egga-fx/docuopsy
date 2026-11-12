import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { readDocumentBytes } from '../api/ipc';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// Bundle the worker locally instead of pulling it from a CDN: keeps PDF parsing
// fully offline and inside the app's CSP (no external connect-src needed).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfViewerProps {
  filePath?: string | null;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ filePath }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    async function loadPdf() {
      setLoading(true);
      setError(null);

      if (!filePath) {
        setError('No PDF file path provided.');
        setLoading(false);
        return;
      }

      try {
        // Desktop: read raw bytes through the authorized IPC command.
        // Browser dev: readDocumentBytes falls back to fetch() for blob:/http URLs.
        const bytes = await readDocumentBytes(filePath);
        if (isCancelled) return;

        loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
        const pdf = await loadingTask.promise;

        if (isCancelled) {
          await pdf.destroy().catch(() => {});
          return;
        }

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: unknown) {
        if (!isCancelled) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(`Unable to open PDF: ${errMsg}`);
          setLoading(false);
        }
      }
    }

    void loadPdf();

    return () => {
      isCancelled = true;
      // Release the worker/document so switching tabs does not leak memory.
      if (pdfDocRef.current) {
        void pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      } else if (loadingTask) {
        void loadingTask.destroy().catch(() => {});
      }
    };
  }, [filePath]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    let renderTask: pdfjsLib.RenderTask | null = null;

    async function renderPage() {
      if (!pdfDocRef.current || !canvasRef.current) return;
      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        // Ignored if cancelled during render
      }
    }

    renderPage();

    return () => {
      if (renderTask) renderTask.cancel();
    };
  }, [currentPage, scale, numPages]);

  return (
    <div className="h-full w-full flex flex-col bg-app-canvas select-none">
      {/* PDF Controls Toolbar */}
      <div
        role="toolbar"
        aria-label="pdf-controls"
        className="h-9 bg-app-surface border-b border-app-border px-4 flex items-center justify-between font-mono text-xs text-app-muted"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-app-accent" />
          <span className="tabular-nums text-app-primary">
            Page {currentPage} of {numPages || 1}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              aria-label="Previous Page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded-full hover:bg-app-surface-hover text-app-muted hover:text-app-primary disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next Page"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              className="p-1 rounded-full hover:bg-app-surface-hover text-app-muted hover:text-app-primary disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="tabular-nums text-app-primary">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom Out"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
            className="p-1 rounded-full hover:bg-app-surface-hover text-app-muted hover:text-app-primary transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Zoom In"
            onClick={() => setScale((s) => Math.min(3.0, s + 0.15))}
            className="p-1 rounded-full hover:bg-app-surface-hover text-app-muted hover:text-app-primary transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Canvas Viewport */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-app-canvas">
        {loading && (
          <div className="text-app-muted font-mono text-xs animate-pulse">
            Loading forensic PDF document...
          </div>
        )}
        {error && (
          <div className="text-rose-500 font-mono text-xs max-w-md text-center p-4 bg-app-shell border border-app-border rounded">
            {error}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`shadow-2xl rounded border border-app-border max-w-full ${
            loading || error ? 'hidden' : 'block'
          }`}
        />
      </div>
    </div>
  );
};

