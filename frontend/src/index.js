import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importa o App.jsx que está na sua pasta src
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);