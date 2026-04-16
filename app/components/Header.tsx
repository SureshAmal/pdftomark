"use client";

import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onFileSelect: (file: File) => void;
  convertedCount: number;
  totalPages: number;
  onDownloadAll: () => void;
  onOpenSummary: () => void;
  hasFile: boolean;
  isConverting: boolean;
  onStopConversion: () => void;
  onStartConversion: (start: number, end: number) => void;
  onCloseFile: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  model: string;
  onModelChange: (model: string) => void;
}

export default function Header({
  onFileSelect,
  convertedCount,
  totalPages,
  onDownloadAll,
  onOpenSummary,
  hasFile,
  isConverting,
  onStopConversion,
  onStartConversion,
  onCloseFile,
  apiKey,
  onApiKeyChange,
  customPrompt,
  onCustomPromptChange,
  model,
  onModelChange,
}: HeaderProps) {
  const [startPage, setStartPage] = useState<string>("1");
  const [endPage, setEndPage] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

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
          <button className="btn" onClick={onCloseFile} style={{ color: "var(--color-text-tertiary)", borderColor: "var(--color-border-primary)" }} title="Close File & Go Back">
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
              style={{ width: "52px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-primary)", background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", fontSize: "13px", textAlign: "center", padding: "0 4px" }}
              title="Start Page" placeholder="From"
              disabled={convertedCount === totalPages && totalPages > 0}
            />
            <span style={{ color: "var(--color-text-tertiary)" }}>-</span>
            <input
              type="number" min="1" max={totalPages}
              value={endPage} onChange={(e) => setEndPage(e.target.value)}
              style={{ width: "52px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-primary)", background: "var(--color-bg-secondary)", color: "var(--color-text-primary)", fontSize: "13px", textAlign: "center", padding: "0 4px" }}
              title="End Page" placeholder="To"
              disabled={convertedCount === totalPages && totalPages > 0}
            />
            <button className="btn btn-primary" style={{ opacity: (convertedCount === totalPages && totalPages > 0) ? 0.5 : 1, cursor: (convertedCount === totalPages && totalPages > 0) ? 'not-allowed' : 'pointer' }} onClick={() => onStartConversion(parseInt(startPage) || 1, parseInt(endPage) || totalPages)} disabled={convertedCount === totalPages && totalPages > 0}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              <span className="hide-on-mobile">Start</span>
            </button>
          </div>
        )}

        {isConverting && (
          <button className="btn" onClick={onStopConversion} style={{ color: "var(--color-text-error)", borderColor: "var(--color-text-error)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
            <span className="hide-on-mobile">Stop</span>
          </button>
        )}

        {hasFile && convertedCount > 0 && !isConverting && (
          <>
            <button className="btn" onClick={onOpenSummary}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span className="hide-on-mobile">Summary</span>
            </button>
            <button className="btn" onClick={onDownloadAll}>
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
          </>
        )}

        <div style={{ position: "relative" }}>
          <button 
            className="btn" 
            onClick={() => setShowSettings(!showSettings)}
            style={{ width: "34px", padding: 0 }}
            title="Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>

          {showSettings && (
            <div 
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "280px",
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border-primary)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Settings</h3>
                <button 
                  onClick={() => setShowSettings(false)} 
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-tertiary)", lineHeight: "1.4" }}>
                Enter your own Google Gemini API Key to bypass the server limits. Your key is stored locally in your browser.
              </p>
              <input
                type="password"
                placeholder="GEMINI_API_KEY"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-primary)",
                  background: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  fontSize: "13px",
                  marginTop: "4px"
                }}
              />
              <hr style={{ border: "none", borderTop: "1px solid var(--color-border-primary)", margin: "8px 0" }} />
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-tertiary)", lineHeight: "1.4" }}>
                Add custom instructions to the AI prompt (e.g., "Summarize this page", "Extract only tables").
              </p>
              <textarea
                placeholder="Custom Prompt"
                value={customPrompt}
                onChange={(e) => onCustomPromptChange(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-primary)",
                  background: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  fontSize: "13px",
                  marginTop: "4px",
                  resize: "vertical"
                }}
              />
              <hr style={{ border: "none", borderTop: "1px solid var(--color-border-primary)", margin: "8px 0" }} />
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-tertiary)", lineHeight: "1.4" }}>
                Select AI Model (Flash Lite is fast, Pro is smart)
              </p>
              <select
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-primary)",
                  background: "var(--color-bg-primary)",
                  color: "var(--color-text-primary)",
                  fontSize: "13px",
                  marginTop: "4px"
                }}
              >
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                <option value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
              </select>
            </div>
          )}
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
