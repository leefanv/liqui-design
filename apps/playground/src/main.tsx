import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@liqui-design/glass/tokens.css';
import { ToastProvider } from '@registry/ui/toast';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* The provider holds the toast queue, so it has to outlive anything that
        raises one — App itself included. */}
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
