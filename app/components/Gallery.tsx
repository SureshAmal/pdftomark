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
}

export default function Gallery({ history, onSelect, onDelete }: GalleryProps) {
  if (history.length === 0) {
    return (
      <div className="gallery-container empty">
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
            Upload a PDF document using the button in the top right to get started. 
            Your history will be securely saved here offline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h2 className="gallery-title">Recent Documents</h2>
        <p className="gallery-subtitle">Pick up where you left off. Files are securely stored offline in your browser.</p>
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
                <div className="gallery-card-progress">
                  <div className="progress-bar-bg" style={{ height: '4px', marginTop: '8px' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(item.convertedCount / item.totalPages) * 100}%`, height: '4px' }} 
                    />
                  </div>
                  <p className="gallery-card-meta" style={{ marginTop: '4px', textAlign: 'right' }}>
                    {item.convertedCount} / {item.totalPages} Pages
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
