"use client";

interface ProgressBarProps {
  converted: number;
  total: number;
}

export default function ProgressBar({ converted, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <div className="progress-container">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-label">
        {converted}/{total}
      </span>
    </div>
  );
}
