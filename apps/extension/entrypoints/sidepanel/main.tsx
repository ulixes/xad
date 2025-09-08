import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import { PrivyProvider } from '@privy-io/react-auth';
import { ThemeProvider } from '@xad/ui';
import { SidePanelApp } from '../../src/components/SidePanelApp';
import { AuthStateManager } from '../../src/components/AuthStateManager';
import '../../src/styles/index.css';

// Buffer polyfill for Privy compatibility
if (typeof window !== 'undefined') {
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).global = (window as any).global || window;
}

const SidePanel = () => {
  return (
    <React.StrictMode>
      <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID || 'cmf6izaj6006mld0brhfx9u7d'}>
        <ThemeProvider defaultTheme="dark" storageKey="extension-theme">
          <AuthStateManager>
            <SidePanelApp />
          </AuthStateManager>
        </ThemeProvider>
      </PrivyProvider>
    </React.StrictMode>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
}