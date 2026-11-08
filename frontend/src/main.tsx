import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AuthProvider } from '@/context/AuthProvider';
import { SocketProvider } from '@/context/SocketContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
