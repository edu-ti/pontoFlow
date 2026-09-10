import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro do Service Worker para suporte a PWA (Instalação no Android / iOS)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('PontoFlow Service Worker registrado:', reg.scope);
    }).catch((err) => {
      console.error('Falha ao registrar Service Worker:', err);
    });
  });
}
