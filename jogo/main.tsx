import React from 'react';
import ReactDOM from 'react-dom/client';
import { JogoApp } from './JogoApp';
import '../index.css';
import './jogo.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <JogoApp />
  </React.StrictMode>
);
