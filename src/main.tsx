import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './utils/chart/setup';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);