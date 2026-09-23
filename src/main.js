/**
 * Application Entry Point
 * Source of Truth: IoT_Lab_Dashboard_V7_Emergency_Fast.html
 */

import './styles.css';
import { initApp } from './app.js';

// Initialize PWA service worker registration
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('PWA service worker registration error:', err);
    });
  });
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
