"use client";

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  suppressErrorRendering: true,
});

export default function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const timeoutId = setTimeout(async () => {
      if (!containerRef.current || !chart || typeof chart !== 'string' || chart.trim().length === 0) return;
      
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      
      try {
        setError(null);
        const cleanChart = chart.trim();
        
        const { svg, bindFunctions } = await mermaid.render(id, cleanChart);
        
        // Prevent the bomb error SVG from replacing the last valid diagram
        if (svg.includes('Syntax error in text') || svg.includes('Syntax error') || svg.includes('mermaid version')) {
          throw new Error('Parse error');
        }
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
          if (bindFunctions) {
            bindFunctions(containerRef.current);
          }
        }
      } catch (err: any) {
        // Find and remove just the specific error element for this ID (if it bypassed suppressErrorRendering)
        const errorElement = document.getElementById('d' + id);
        if (errorElement) errorElement.remove();
        
        const errorMessage = typeof err === 'string' ? err : (err?.message || err?.str || String(err));
        // Ignore parsing errors for partial streams 
        if ((errorMessage.includes('No diagram type detected') || 
             errorMessage.toLowerCase().includes('parse error') || 
             errorMessage.includes('Expecting') ||
             errorMessage.includes('Lexical error') ||
             errorMessage.includes('Syntax error')) && isMounted) {
            // Do nothing, just wait for more chunks to stream in
        } else if (isMounted) {
          setError('Failed to render diagram. Invalid Mermaid syntax.');
        }
      }
    }, 400); // 400ms debounce to prevent layout bouncing

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [chart]);

  if (error) {
    return (
      <div style={{ color: 'var(--color-text-error)', padding: '1rem', border: '1px solid var(--color-text-error)', borderRadius: 'var(--radius-sm)', margin: '1rem 0', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
        <p><strong>Mermaid Diagram Error:</strong></p>
        <pre style={{ overflowX: 'auto', marginTop: '0.5rem' }}>{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      className="mermaid-wrapper" 
      ref={containerRef} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '1.5rem 0', 
        overflowX: 'auto',
        background: 'var(--color-bg-secondary)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)'
      }} 
    />
  );
}
