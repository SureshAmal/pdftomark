"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import ProgressBar from "./ProgressBar";

export type PageStatus = "pending" | "converting" | "done" | "error";

interface MarkdownPanelProps {
  markdown: string | null;
  status: PageStatus;
  currentPage: number;
  totalPages: number;
  convertedCount: number;
  errorMessage?: string;
  onReconvert: () => void;
}

export default function MarkdownPanel({
  markdown,
  status,
  currentPage,
  totalPages,
  convertedCount,
  errorMessage,
  onReconvert,
}: MarkdownPanelProps) {
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");

  const renderContent = () => {
    switch (status) {
      case "converting":
        return (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">
              Converting page {currentPage} to markdown...
            </p>
            <p className="loading-text loading-pulse">
              Sending to Gemini AI
            </p>
          </div>
        );

      case "done":
        return (
          <div className="markdown-body" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="markdown-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {viewMode === "preview" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeKatex]}
                >
                  {markdown || "*No content extracted from this page.*"}
                </ReactMarkdown>
              ) : (
                <textarea 
                  value={markdown || "*No content extracted from this page.*"}
                  readOnly
                  style={{ 
                    flex: 1, 
                    width: "100%", 
                    minHeight: "100%",
                    fontFamily: "monospace", 
                    fontSize: "13px",
                    lineHeight: "1.5",
                    resize: "none", 
                    background: "transparent", 
                    border: "none", 
                    color: "var(--color-text-primary)", 
                    outline: "none" 
                  }}
                />
              )}
            </div>
          </div>
        );

      case "error":
        return (
          <div className="loading-container">
            <div
              className="empty-state-icon"
              style={{ background: "rgba(225,112,85,0.1)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <p className="empty-state-title" style={{ color: "var(--color-text-error)" }}>
              Conversion Failed
            </p>
            <p className="empty-state-desc">
              {errorMessage || "An error occurred while converting this page."}
            </p>
          </div>
        );

      case "pending":
      default:
        return (
          <div className="loading-container">
            <div className="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <p className="empty-state-title">Waiting to convert</p>
            <p className="empty-state-desc">
              This page is queued for conversion. {convertedCount} of{" "}
              {totalPages} pages converted so far.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="panel-header-title">Markdown Output</span>
          {status === "done" && (
            <div style={{ display: "flex", background: "var(--color-bg-tertiary)", borderRadius: "var(--radius-md)", padding: "2px" }}>
                <button 
                  onClick={() => setViewMode('preview')}
                  style={{ 
                    padding: "4px 8px", fontSize: "12px", minHeight: "0", cursor: "pointer",
                    background: viewMode === 'preview' ? "var(--color-bg-secondary)" : "transparent", 
                    border: "none", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontWeight: viewMode === 'preview' ? 600 : 400
                  }}
                >
                  Preview
                </button>
                <button 
                  onClick={() => setViewMode('raw')}
                  style={{ 
                    padding: "4px 8px", fontSize: "12px", minHeight: "0", cursor: "pointer",
                    background: viewMode === 'raw' ? "var(--color-bg-secondary)" : "transparent", 
                    border: "none", borderRadius: "var(--radius-sm)", color: "var(--color-text-primary)", fontWeight: viewMode === 'raw' ? 600 : 400
                  }}
                >
                  Raw
                </button>
            </div>
          )}
          {(status === "done" || status === "error") && (
            <button
              onClick={onReconvert}
              className="btn"
              style={{ padding: "4px 8px", fontSize: "12px", minHeight: "0" }}
              aria-label="Reconvert page"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
              Retry
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          {totalPages > 0 && (
            <>
              <div className="hide-on-mobile" style={{ marginRight: '8px' }}>
                <ProgressBar converted={convertedCount} total={totalPages} />
              </div>
              <span className={`status-badge ${status}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {status === "converting" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>}
              {status === "done" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              {status === "error" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
              {status === "pending" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            </>
          )}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
