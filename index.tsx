
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { v4 } from 'uuid'; // Ensure imported for deps check

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker registration removed to avoid origin mismatch errors in sandboxed environments.
