import { useState } from "react";

export interface PdfMetadata {
  id: string;
  name: string;
  size: number;
  lastOpened: number;
  totalPages: number;
  convertedCount: number;
}

interface GalleryProps {
  history: PdfMetadata[];
  onSelect: (metadata: PdfMetadata) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDropFile: (file: File) => void;
}

export default function Gallery({ history, onSelect, onDelete, onDropFile }: GalleryProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        onDropFile(file);
      } else {
        alert("Please drop a valid .pdf file.");
      }
    }
  };

  const dropOverlay = isDragging && (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.8)", // fallback darker background
      backdropFilter: "blur(4px)",
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "3px dashed var(--color-accent)",
      borderRadius: "var(--radius-lg)",
      margin: "var(--space-md)",
      pointerEvents: "none" // allow drop events to pass through
    }}>
      <div style={{ background: "var(--color-accent)", color: "white", padding: "20px", borderRadius: "50%", marginBottom: "20px" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </div>
      <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>Drop PDF to convert</h2>
    </div>
  );
  if (history.length === 0) {
    return (
      <div 
        className="gallery-container empty"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ position: "relative" }}
      >
        {dropOverlay}
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <p className="empty-state-title">Welcome to PDF to Mark</p>
          <p className="empty-state-desc">
            Upload a PDF document using the button in the top right, or <strong>drag and drop a PDF anywhere on this screen</strong> to get started.<br/><br/>
            Your history will be securely saved here offline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="gallery-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: "relative" }}
    >
      {dropOverlay}
      <div className="gallery-header">
        <h2 className="gallery-title">Recent Documents</h2>
        <p className="gallery-subtitle">
          Pick up where you left off. Files are securely stored offline in your browser. 
          <br/>
          <strong>Tip:</strong> You can drag and drop a new `.pdf` file anywhere on this screen to convert it!
        </p>
      </div>
      <div className="gallery-grid">
        {history.sort((a, b) => b.lastOpened - a.lastOpened).map((item) => (
          <div 
            key={item.id} 
            className="gallery-card"
            onClick={() => onSelect(item)}
          >
            <div className="gallery-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div className="gallery-card-content">
              <h3 className="gallery-card-title" title={item.name}>{item.name}</h3>
              <p className="gallery-card-meta">
                {(item.size / 1024 / 1024).toFixed(2)} MB • {new Date(item.lastOpened).toLocaleDateString()}
              </p>
              
              {item.totalPages > 0 && (
                <div className="gallery-card-progress" style={{ marginTop: '8px', textAlign: 'right' }}>
                  <p className="gallery-card-meta">
                    {item.totalPages} Pages
                  </p>
                </div>
              )}
            </div>
            
            <button 
              className="gallery-card-delete"
              onClick={(e) => onDelete(item.id, e)}
              title="Remove from history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
