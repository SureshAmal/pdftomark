"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import { get, set } from 'idb-keyval';
import Header from "./components/Header";
import MarkdownPanel, { type PageStatus } from "./components/MarkdownPanel";
import Gallery, { type PdfMetadata } from "./components/Gallery";

const PdfViewer = dynamic(() => import('./components/PdfViewer'), { ssr: false });

interface PageData {
  status: PageStatus;
  markdown: string | null;
  error?: string;
  base64?: string;
}

const WINDOW_SIZE = 10;
const HISTORY_DB_KEY = "pdf-gallery-index";

export default function Home() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<Record<number, PageData>>({});
  const [isConverting, setIsConverting] = useState(false);
  const [history, setHistory] = useState<PdfMetadata[]>([]);

  // Load history on mount
  useEffect(() => {
    get<PdfMetadata[]>(HISTORY_DB_KEY).then(val => {
      if (val) setHistory(val);
    }).catch(console.error);
  }, []);

  const pagesRef = useRef<Record<number, PageData>>({});
  const base64CacheRef = useRef<Record<number, string>>({});
  const conversionAbortRef = useRef(false);
  const fileIdRef = useRef<string | null>(null);

  // Track how many pages are done
  const convertedCount = Object.values(pages).filter(
    (p) => p.status === "done"
  ).length;

  // Helper to save history to DB
  const updateGalleryIndex = async (newHistory: PdfMetadata[]) => {
    setHistory(newHistory);
    await set(HISTORY_DB_KEY, newHistory).catch(console.error);
  };

  // Handle a new file from disk
  const handleFileSelect = useCallback(async (file: File) => {
    // Revoke old URL
    if (fileUrl) URL.revokeObjectURL(fileUrl);

    const url = URL.createObjectURL(file);
    const newFileId = `${file.name}-${file.size}-${file.lastModified}`;
    
    setFileUrl(url);
    setFileId(newFileId);
    fileIdRef.current = newFileId;
    
    setCurrentPage(1);
    setTotalPages(0);
    setPages({});
    setIsConverting(false);
    pagesRef.current = {};
    base64CacheRef.current = {};
    conversionAbortRef.current = true;
    
    // Save blob to indexedDB
    await set(`${newFileId}-blob`, file).catch(console.error);
    
    // Add to gallery index
    setHistory(prev => {
      const existing = prev.filter(p => p.id !== newFileId);
      const newEntry: PdfMetadata = {
        id: newFileId,
        name: file.name,
        size: file.size,
        lastOpened: Date.now(),
        totalPages: 0,
        convertedCount: 0
      };
      const updated = [newEntry, ...existing];
      set(HISTORY_DB_KEY, updated).catch(console.error);
      return updated;
    });
  }, [fileUrl]);

  // Load from gallery
  const handleGallerySelect = useCallback(async (meta: PdfMetadata) => {
    try {
      const blob = await get<File | Blob>(`${meta.id}-blob`);
      if (blob) {
        // Mock a File object if it's just a Blob
        const file = new File([blob], meta.name, {
          type: "application/pdf",
          lastModified: meta.lastOpened // Fallback
        });
        
        if (fileUrl) URL.revokeObjectURL(fileUrl);
        const url = URL.createObjectURL(file);
        
        setFileUrl(url);
        setFileId(meta.id);
        fileIdRef.current = meta.id;
        
        setCurrentPage(1);
        setTotalPages(meta.totalPages || 0); // Will be updated by document load anyway
        setPages({});
        setIsConverting(false);
        pagesRef.current = {};
        base64CacheRef.current = {};
        conversionAbortRef.current = true;
        
        // Update last opened timestamp
        setHistory(prev => {
          const arr = [...prev];
          const idx = arr.findIndex(p => p.id === meta.id);
          if (idx !== -1) {
            arr[idx] = { ...arr[idx], lastOpened: Date.now() };
            set(HISTORY_DB_KEY, arr).catch(console.error);
          }
          return arr;
        });
      }
    } catch (err) {
      console.error("Failed to load PDF from gallery", err);
      // Optional: alert user or handle error
    }
  }, [fileUrl]);

  // Delete from gallery
  const handleGalleryDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remove from index
    setHistory(prev => {
      const updated = prev.filter(p => p.id !== id);
      set(HISTORY_DB_KEY, updated).catch(console.error);
      return updated;
    });
    
    // Cleanup blobs
    import('idb-keyval').then(({ del }) => {
      del(`${id}-blob`).catch(console.error);
    });
  }, []);

  // Close the current file and go back to Gallery
  const handleCloseFile = useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFileId(null);
    fileIdRef.current = null;
    setCurrentPage(1);
    setTotalPages(0);
    setPages({});
    setIsConverting(false);
    pagesRef.current = {};
    base64CacheRef.current = {};
    conversionAbortRef.current = true;
  }, [fileUrl]);

  // When PDF document loads, initialize page state and begin conversion
  const handleDocumentLoad = useCallback(async (numPages: number) => {
    setTotalPages(numPages);

    const initial: Record<number, PageData> = {};
    for (let i = 1; i <= numPages; i++) {
      initial[i] = { status: "pending", markdown: null };
    }

    // Preload cached results
    if (fileIdRef.current) {
      for (let i = 1; i <= numPages; i++) {
        try {
          const cached = await get(`${fileIdRef.current}-page-${i}`);
          if (cached) {
            initial[i] = { status: "done", markdown: cached as string };
          }
        } catch (e) {
          // ignore cache errors
        }
      }
    }

    setPages(initial);
    pagesRef.current = initial;
    conversionAbortRef.current = false;
  }, []);

  // Cache base64 images as pages render
  const handlePageRendered = useCallback(
    (pageNum: number, base64: string) => {
      base64CacheRef.current[pageNum] = base64;
    },
    []
  );

  // Convert a single page via the API route
  const convertPage = async (
    pageNum: number,
    base64: string
  ): Promise<{ markdown: string } | { error: string }> => {
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, pageNumber: pageNum }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "Conversion failed" };
      }

      return { markdown: data.markdown };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  };

  // Render a page to get its base64 (for pages not yet viewed)
  const getPageBase64 = async (
    pageNum: number,
    pdfUrl: string
  ): Promise<string | null> => {
    // Check cache first
    if (base64CacheRef.current[pageNum]) {
      return base64CacheRef.current[pageNum];
    }

    // Render the page off-screen
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;

      await page.render({ canvasContext: ctx, viewport } as any).promise;

      const base64 = canvas.toDataURL("image/png");
      base64CacheRef.current[pageNum] = base64;
      return base64;
    } catch {
      return null;
    }
  };

  // Start the windowed conversion process for a specific range
  const startConversionForRange = async (start: number, end: number) => {
    setIsConverting(true);
    conversionAbortRef.current = false;
    const url = fileUrl;
    if (!url || totalPages === 0) return;

    const safeStart = Math.max(1, start);
    const safeEnd = Math.min(totalPages, end);

    for (let windowStart = safeStart - 1; windowStart < safeEnd; windowStart += WINDOW_SIZE) {
      if (conversionAbortRef.current) break;

      const windowEnd = Math.min(windowStart + WINDOW_SIZE, safeEnd);

      // Process pages sequentially within each window (rate limiting)
      for (let i = windowStart; i < windowEnd; i++) {
        if (conversionAbortRef.current) break;

        const pageNum = i + 1;

        // Skip if already done
        if (pagesRef.current[pageNum]?.status === "done") continue;

        // Update status to converting
        updatePageStatus(pageNum, "converting");

        // Get base64 image for this page
        const base64 = await getPageBase64(pageNum, url);

        if (!base64 || conversionAbortRef.current) {
          if (!conversionAbortRef.current) {
            updatePageStatus(pageNum, "error", undefined, "Failed to render page");
          }
          continue;
        }

        // Call the API
        const result = await convertPage(pageNum, base64);

        if (conversionAbortRef.current) break;

        if ("error" in result) {
          updatePageStatus(pageNum, "error", undefined, result.error);
        } else {
          updatePageStatus(pageNum, "done", result.markdown);
          // Cache successful result
          if (fileIdRef.current) {
            set(`${fileIdRef.current}-page-${pageNum}`, result.markdown).catch(console.error);
          }
        }

        // Small delay between pages to respect rate limits
        if (i < windowEnd - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }

    setIsConverting(false);
  };

  // Stop the conversion process
  const stopConversion = useCallback(() => {
    conversionAbortRef.current = true;
    setIsConverting(false);

    setPages((prev) => {
      const updated = { ...prev };
      let changed = false;
      for (const key in updated) {
        if (updated[key].status === "converting") {
          updated[key] = { ...updated[key], status: "pending" };
          changed = true;
        }
      }
      if (changed) pagesRef.current = updated;
      return changed ? updated : prev;
    });
  }, []);

  // Reconvert a specific page
  const reconvertPage = async (pageNum: number) => {
    const url = fileUrl;
    if (!url) return;

    updatePageStatus(pageNum, "converting");
    const base64 = await getPageBase64(pageNum, url);
    if (!base64) {
      updatePageStatus(pageNum, "error", undefined, "Failed to render page");
      return;
    }

    const result = await convertPage(pageNum, base64);
    if ("error" in result) {
      updatePageStatus(pageNum, "error", undefined, result.error);
    } else {
      updatePageStatus(pageNum, "done", result.markdown);
      // Cache successful result
      if (fileIdRef.current) {
        set(`${fileIdRef.current}-page-${pageNum}`, result.markdown).catch(console.error);
      }
    }
  };

  // Helper to update a page's status
  const updatePageStatus = (
    pageNum: number,
    status: PageStatus,
    markdown?: string,
    error?: string
  ) => {
    setPages((prev) => {
      const updated = {
        ...prev,
        [pageNum]: {
          ...prev[pageNum],
          status,
          ...(markdown !== undefined ? { markdown } : {}),
          ...(error !== undefined ? { error } : {}),
        },
      };
      pagesRef.current = updated;
      return updated;
    });
  };

  // Keep gallery index updated with progress
  useEffect(() => {
    if (fileIdRef.current && totalPages > 0) {
      setHistory(prev => {
        const idx = prev.findIndex(p => p.id === fileIdRef.current);
        if (idx !== -1 && (prev[idx].convertedCount !== convertedCount || prev[idx].totalPages !== totalPages)) {
          const arr = [...prev];
          arr[idx] = { ...arr[idx], convertedCount, totalPages };
          set(HISTORY_DB_KEY, arr).catch(console.error);
          return arr;
        }
        return prev;
      });
    }
  }, [convertedCount, totalPages]);

  // Download all converted markdown as a single file
  const handleDownloadAll = useCallback(() => {
    const parts: string[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = pages[i];
      if (page?.status === "done" && page.markdown) {
        parts.push(`<!-- Page ${i} -->\n\n${page.markdown}`);
      }
    }

    if (parts.length === 0) return;

    const content = parts.join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [pages, totalPages]);

  // Current page data
  const currentPageData = pages[currentPage] || {
    status: "pending" as PageStatus,
    markdown: null,
  };

  return (
    <>
      <Header
        onFileSelect={handleFileSelect}
        convertedCount={convertedCount}
        totalPages={totalPages}
        onDownloadAll={handleDownloadAll}
        hasFile={!!fileUrl}
        isConverting={isConverting}
        onStopConversion={stopConversion}
        onStartConversion={startConversionForRange}
        onCloseFile={handleCloseFile}
      />
      <main className="app-main">
        {fileUrl ? (
          <div className="content-grid">
            <PdfViewer
              fileUrl={fileUrl}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onDocumentLoad={handleDocumentLoad}
              onPageRendered={handlePageRendered}
            />

            {totalPages > 0 ? (
              <MarkdownPanel
                markdown={currentPageData.markdown}
                status={currentPageData.status}
                currentPage={currentPage}
                totalPages={totalPages}
                convertedCount={convertedCount}
                errorMessage={currentPageData.error}
                onReconvert={() => reconvertPage(currentPage)}
              />
            ) : (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-header-title">Markdown Output</span>
                </div>
                <div className="panel-body">
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                    <p className="empty-state-title">Ready to convert</p>
                    <p className="empty-state-desc">
                      Upload a PDF to see the converted markdown here
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Gallery history={history} onSelect={handleGallerySelect} onDelete={handleGalleryDelete} />
        )}
      </main>
    </>
  );
}
