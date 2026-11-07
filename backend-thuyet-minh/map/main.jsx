import React from 'react';
import { createRoot } from 'react-dom/client';
import ArtifactMapPage from './ArtifactMapPage.jsx';
import './map.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><ArtifactMapPage height="100dvh" /></React.StrictMode>,
);
