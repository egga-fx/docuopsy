import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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

    async function loadPdf() {
      setLoading(true);
      setError(null);

      try {
        if (!filePath) {
          setError('No PDF file path provided.');
          setLoading(false);
          return;
        }

        // In desktop environment, convert path to file:// URL or fetch byte array
        const url = filePath.startsWith('http') || filePath.startsWith('blob:')
          ? filePath
          : `file://${filePath.replace(/\\/g, '/')}`;

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!isCancelled) {
          pdfDocRef.current = pdf;
          setNumPages(pdf.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(`Unable to open PDF: ${errMsg}`);
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
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
    <div className="h-full w-full flex flex-col bg-obsidian select-none">
      {/* PDF Controls Toolbar */}
      <div
        role="toolbar"
        aria-label="pdf-controls"
        className="h-9 bg-slate-shell border-b border-slate-border px-4 flex items-center justify-between font-mono text-xs text-slate-muted"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-verdigris" />
          <span className="tabular-nums">
            Page {currentPage} of {numPages || 1}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              aria-label="Previous Page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 rounded hover:bg-slate-surface text-slate-muted hover:text-parchment disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next Page"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              className="p-1 rounded hover:bg-slate-surface text-slate-muted hover:text-parchment disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom Out"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
            className="p-1 rounded hover:bg-slate-surface text-slate-muted hover:text-parchment"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Zoom In"
            onClick={() => setScale((s) => Math.min(3.0, s + 0.15))}
            className="p-1 rounded hover:bg-slate-surface text-slate-muted hover:text-parchment"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Canvas Viewport */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-surface/40">
        {loading && (
          <div className="text-slate-muted font-mono text-xs animate-pulse">
            Loading forensic PDF document...
          </div>
        )}
        {error && (
          <div className="text-crimson-alert font-mono text-xs max-w-md text-center p-4 bg-slate-shell border border-slate-border rounded">
            {error}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`shadow-2xl rounded border border-slate-border/50 max-w-full ${
            loading || error ? 'hidden' : 'block'
          }`}
        />
      </div>
    </div>
  );
};

