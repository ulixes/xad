import React from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { TaskProvider } from '@/lib/context/TaskProvider';
import { SidePanelContent } from './SidePanelContent';
import { Buffer } from 'buffer';
import '@/src/styles/globals.css';

// Ensure Buffer is available for SDKs that expect Node globals
(window as any).Buffer = (window as any).Buffer || Buffer;

const SidePanelApp: React.FC = () => {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID as string}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#ff3333',
          logo: browser.runtime.getURL('/icon/128.png'),
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users'
          }
        },
        legal: {
          termsAndConditionsUrl: 'https://your-app.com/terms',
          privacyPolicyUrl: 'https://your-app.com/privacy'
        }
      }}
    >
      <TaskProvider>
        <SidePanelContent />
      </TaskProvider>
    </PrivyProvider>
  );
};

// Initialize React app
const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanelApp />);
} else {
}