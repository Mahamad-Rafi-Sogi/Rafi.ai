import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Remove any development attributions
function removeDevAttributions() {
  const selectors = [
    '[data-bolt]',
    '[class*="bolt"]', 
    '[id*="bolt"]',
    '[data-testid*="bolt"]',
    'div[style*="position: fixed"][style*="bottom"]',
    'div[style*="position: absolute"][style*="bottom"]',
    '.fixed.bottom-0',
    '.fixed.bottom-1', 
    '.fixed.bottom-2',
    '.fixed.bottom-3',
    '.fixed.bottom-4',
    '.absolute.bottom-0',
    '.absolute.bottom-1',
    '.absolute.bottom-2',
    '.absolute.bottom-3',
    '.absolute.bottom-4'
  ];
  
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.textContent?.toLowerCase().includes('bolt') || 
            el.textContent?.toLowerCase().includes('made in') ||
            el.textContent?.toLowerCase().includes('powered by') ||
            el.getAttribute('class')?.includes('bolt') ||
            el.getAttribute('id')?.includes('bolt')) {
          el.remove();
        }
      });
    } catch (e) {
      // Ignore selector errors
    }
  });

  // Remove any overlay with development text
  const allElements = document.querySelectorAll('*');
  allElements.forEach(el => {
    const text = el.textContent?.toLowerCase() || '';
    const htmlEl = el as HTMLElement;
    if ((text.includes('made in') || text.includes('bolt') || text.includes('powered by')) && 
        (htmlEl.style?.position === 'fixed' || htmlEl.style?.position === 'absolute')) {
      el.remove();
    }
  });
}

// Run on load and periodically check
document.addEventListener('DOMContentLoaded', removeDevAttributions);
setInterval(removeDevAttributions, 1000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
