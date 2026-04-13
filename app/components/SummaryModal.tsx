"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { get, set } from "idb-keyval";
import MermaidDiagram from "./MermaidDiagram";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentText: string;
  apiKey?: string;
  fileId?: string | null;
}

export default function SummaryModal({ isOpen, onClose, documentText, apiKey, fileId }: SummaryModalProps) {
  const [summary, setSummary] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "raw">("preview");
  const abortControllerRef = useRef<AbortController | null>(null);

  const remarkPlugins = useMemo(() => [remarkGfm, remarkMath, remarkBreaks], []);
  const rehypePlugins = useMemo(() => [rehypeKatex, rehypeHighlight], []);

  const markdownComponents = useMemo(() => ({
    code(props: any) {
      const { children, className, node, ...rest } = props;
      const match = /language-(\w+)/.exec(className || "");
      if (match && match[1] === "mermaid") {
        return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
      }
      return (
        <code {...rest} className={className}>
          {children}
        </code>
      );
    },
  }), []);

  useEffect(() => {
    if (!isOpen && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [isOpen]);

  useEffect(() => {
    if (fileId) {
      setSummary("");
      setPrompt("");
      setError(null);
      setViewMode("preview");
      get(`${fileId}-summary`).then((val) => {
        if (val) setSummary(val as string);
      }).catch(console.error);
    }
  }, [fileId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const generateSummary = async () => {
    if (!documentText) return;
    
    setIsGenerating(true);
    setError(null);
    setSummary("");
    
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          documentText, 
          prompt: prompt.trim() || undefined, 
          apiKey: apiKey || localStorage.getItem("gemini_api_key") || undefined 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let fullSummary = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullSummary += chunk;
        setSummary((prev) => prev + chunk);
      }
      
      // Save completed summary to IDB
      if (fileId) {
        set(`${fileId}-summary`, fullSummary).catch(console.error);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "var(--color-bg-overlay)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "20px"
    }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
        background: "var(--color-bg-secondary)", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-lg)", width: "100%", maxWidth: "800px",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        border: "1px solid var(--color-border-primary)", overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border-secondary)" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--color-text-primary)" }}>Document Summary</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)" }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              type="text" 
              placeholder="Optional: Enter a prompt to guide the summary (e.g. 'Focus on timeline')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "1px solid var(--color-border-primary)" }}
              className="apikey-input"
            />
            <button 
              className="btn btn-primary" 
              onClick={generateSummary}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : summary ? "Regenerate" : "Generate Summary"}
            </button>
          </div>

          {error && <div style={{ color: "var(--color-text-error)", padding: "10px", background: "var(--color-bg-accent-subtle)", borderRadius: "4px" }}>{error}</div>}

          <div style={{ flex: 1, padding: "16px", border: "1px solid var(--color-border-primary)", borderRadius: "8px", background: "var(--color-bg-primary)", minHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {summary ? (
              viewMode === "preview" ? (
                <div className="markdown-content" style={{ flex: 1 }}>
                  <ReactMarkdown
                    remarkPlugins={remarkPlugins as any}
                    rehypePlugins={rehypePlugins as any}
                    components={markdownComponents}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>
              ) : (
                <div 
                  style={{ 
                    flex: 1, 
                    width: "100%", 
                    minHeight: "100%",
                    background: "transparent", 
                    fontFamily: "var(--font-mono)", 
                    fontSize: "14px", 
                    color: "var(--color-text-primary)", 
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}
                >
                  {summary}
                </div>
              )
            ) : (
              <div style={{ color: "var(--color-text-tertiary)", textAlign: "center", paddingTop: "50px" }}>
                {isGenerating ? "Reading document..." : "Click Generate to summarize the entire document."}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {summary && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--color-border-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px", background: "var(--color-bg-tertiary)", padding: "4px", borderRadius: "100px", border: "1px solid var(--color-border-primary)"}}>
              <button 
                onClick={() => setViewMode("preview")}
                style={{ 
                  padding: "4px 12px", 
                  borderRadius: "100px", 
                  border: "none", 
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  background: viewMode === "preview" ? "var(--color-bg-secondary)" : "transparent",
                  color: viewMode === "preview" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  boxShadow: viewMode === "preview" ? "var(--shadow-sm)" : "none"
                }}
              >
                Preview
              </button>
              <button 
                onClick={() => setViewMode("raw")}
                style={{ 
                  padding: "4px 12px", 
                  borderRadius: "100px", 
                  border: "none", 
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  background: viewMode === "raw" ? "var(--color-bg-secondary)" : "transparent",
                  color: viewMode === "raw" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  boxShadow: viewMode === "raw" ? "var(--shadow-sm)" : "none"
                }}
              >
                Raw
              </button>
            </div>
            
            <button className="btn btn-success" onClick={handleDownload}>
              Download Markdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
}