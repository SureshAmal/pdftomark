"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  fileUrl: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDocumentLoad: (numPages: number) => void;
  onPageRendered: (pageNum: number, base64: string) => void;
}

export default function PdfViewer({
  fileUrl,
  currentPage,
  totalPages,
  onPageChange,
  onDocumentLoad,
  onPageRendered,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderingRef = useRef(false);

  // Load PDF document
  useEffect(() => {
    if (!fileUrl) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        onDocumentLoad(pdf.numPages);
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, onDocumentLoad]);

  // Render current page
  const renderPage = useCallback(async () => {
    const pdf = pdfDoc;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!pdf || !canvas || !container || renderingRef.current) return;

    renderingRef.current = true;

    try {
      const page = await pdf.getPage(currentPage);

      // Calculate scale to fit container, avoiding negative dimensions on initial mount
      const containerWidth = Math.max(container.clientWidth - 32, 200); // 32px arbitrary padding, min 200px
      const containerHeight = Math.max(container.clientHeight - 32, 200);
      const unscaledViewport = page.getViewport({ scale: 1 });

      const scaleX = containerWidth / unscaledViewport.width;
      const scaleY = containerHeight / unscaledViewport.height;
      const scale = Math.max(0.5, Math.min(scaleX, scaleY, 2)); // Lock scale between 0.5x and 2.0x

      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext("2d")!;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport } as any).promise;

      // Generate base64 for AI conversion
      const base64 = canvas.toDataURL("image/png");
      onPageRendered(currentPage, base64);
    } catch (err) {
      console.error("Failed to render page:", err);
    } finally {
      renderingRef.current = false;
    }
  }, [currentPage, onPageRendered, pdfDoc]);

  useEffect(() => {
    if (pdfDoc && currentPage > 0) {
      renderPage();
    }
  }, [currentPage, renderPage, pdfDoc]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc && currentPage > 0) {
        renderPage();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentPage, renderPage, pdfDoc]);

  if (!fileUrl) {
    return (
      <div className="panel panel-left">
        <div className="panel-header">
          <span className="panel-header-title">PDF Preview</span>
        </div>
        <div className="panel-body">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            </div>
            <p className="empty-state-title">No PDF loaded</p>
            <p className="empty-state-desc">
              Upload a PDF file to get started with the conversion
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel panel-left">
      <div className="panel-header">
        <span className="panel-header-title">PDF Preview</span>
        <div className="page-nav">
          <button
            className="page-nav-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span className="page-badge">
            {currentPage} / {totalPages}
          </span>
          <button
            className="page-nav-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
      <div className="panel-body" ref={containerRef}>
        <div className="pdf-canvas-container">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
