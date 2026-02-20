/*
– Author: AI Assistant
– OS support: Web Browser / Node.js
– Description: Main entry point for the React application
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { v4 } from 'uuid';

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

/* --- End of index.tsx --- */
