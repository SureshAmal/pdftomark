"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onFileSelect: (file: File) => void;
  convertedCount: number;
  totalPages: number;
  onDownloadAll: () => void;
  hasFile: boolean;
  isConverting: boolean;
  onStopConversion: () => void;
  onStartConversion: (start: number, end: number) => void;
  onCloseFile: () => void;
}

export default function Header({
  onFileSelect,
  convertedCount,
  totalPages,
  onDownloadAll,
  hasFile,
  isConverting,
  onStopConversion,
  onStartConversion,
  onCloseFile,
}: HeaderProps) {
  const [startPage, setStartPage] = useState<string>("1");
  const [endPage, setEndPage] = useState<string>("");

  useEffect(() => {
    if (totalPages > 0) {
      setStartPage("1");
      setEndPage(totalPages.toString());
    }
  }, [totalPages]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
  };

  return (
    <header className="app-header">
      <div className="app-logo">
        <div className="logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <span className="hide-on-mobile">PDF to Mark</span>
      </div>

      <div className="header-actions">
        {hasFile && (
          <button className="btn" onClick={onCloseFile} style={{ color: "var(--color-text-tertiary)", borderColor: "var(--color-border-primary)", padding: "8px" }} title="Close File & Go Back">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
             <span className="hide-on-mobile">Back</span>
          </button>
        )}

        <label className="btn btn-primary" htmlFor="pdf-upload">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="hide-on-mobile">Upload PDF</span>
        </label>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="file-input-hidden"
          onChange={handleFileChange}
        />

        {hasFile && !isConverting && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="number" min="1" max={totalPages}
              value={startPage} onChange={(e) => setStartPage(e.target.value)}
              style={{ width: "40px", padding: "4px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-primary)", background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", fontSize: "12px", textAlign: "center" }}
              title="Start Page" placeholder="From"
            />
            <span style={{ color: "var(--color-text-tertiary)" }}>-</span>
            <input
              type="number" min="1" max={totalPages}
              value={endPage} onChange={(e) => setEndPage(e.target.value)}
              style={{ width: "40px", padding: "4px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-primary)", background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", fontSize: "12px", textAlign: "center" }}
              title="End Page" placeholder="To"
            />
            <button className="btn btn-primary" style={{ padding: "4px 8px" }} onClick={() => onStartConversion(parseInt(startPage) || 1, parseInt(endPage) || totalPages)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span className="hide-on-mobile">Start</span>
            </button>
          </div>
        )}

        {isConverting && (
          <button className="btn" onClick={onStopConversion} style={{ color: "var(--color-text-error)", borderColor: "var(--color-text-error)", padding: "4px 8px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
            <span className="hide-on-mobile">Stop</span>
          </button>
        )}

        {hasFile && convertedCount > 0 && !isConverting && (
          <button className="btn btn-success" style={{ padding: "4px 8px" }} onClick={onDownloadAll}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hide-on-mobile">Download</span>
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
