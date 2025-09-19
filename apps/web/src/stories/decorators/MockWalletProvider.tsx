import React, { ReactNode } from 'react';

// Mock wallet context for Storybook
const MockWalletContext = React.createContext({
  isConnected: false,
  address: undefined as string | undefined,
  open: () => console.log('[Storybook Mock] Opening wallet modal'),
  switchNetwork: async () => console.log('[Storybook Mock] Switching network'),
});

interface MockWalletProviderProps {
  children: ReactNode;
  isConnected?: boolean;
  address?: string;
}

export const MockWalletProvider: React.FC<MockWalletProviderProps> = ({ 
  children, 
  isConnected = false,
  address = '0x1234567890123456789012345678901234567890'
}) => {
  const value = {
    isConnected,
    address: isConnected ? address : undefined,
    open: () => console.log('[Storybook Mock] Opening wallet modal'),
    switchNetwork: async () => console.log('[Storybook Mock] Switching network'),
  };

  return (
    <MockWalletContext.Provider value={value}>
      {children}
    </MockWalletContext.Provider>
  );
};

// Mock hooks that components can use
export const useMockWallet = () => React.useContext(MockWalletContext);