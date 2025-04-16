'use client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { init as Rivet } from 'rivet-core';
import App from './App';
import { AuthProvider } from './AuthContext';
import '../node_modules/rivet-core/css/rivet.min.css';
Rivet();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
