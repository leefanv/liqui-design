import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@liqui-design/glass/tokens.css';
import './lab.css';
import LensLab from './LensLab';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LensLab />
  </StrictMode>,
);
