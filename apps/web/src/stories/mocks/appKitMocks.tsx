import React from 'react';

// Mock AppKit hooks for Storybook
export const mockAppKitHooks = () => {
  // Mock useAppKit
  jest.mock('@reown/appkit/react', () => ({
    useAppKit: () => ({
      open: () => console.log('Mock: Opening wallet modal'),
    }),
    useAppKitAccount: () => ({
      address: '0x1234567890123456789012345678901234567890',
      isConnected: true,
    }),
    useAppKitNetwork: () => ({
      caipNetwork: { id: 84532 }, // Base Sepolia
      switchNetwork: async () => console.log('Mock: Switching network'),
    }),
  }));

  // Mock wagmi hooks
  jest.mock('wagmi', () => ({
    useWalletClient: () => ({
      data: {
        account: { address: '0x1234567890123456789012345678901234567890' },
        signMessage: async () => '0xmocksignature',
      },
    }),
    usePublicClient: () => ({
      data: {
        getBlockNumber: async () => 123456,
      },
    }),
  }));
};

// Decorator that provides mock context
export const AppKitMockDecorator = (Story: React.ComponentType) => {
  // Override the modules at runtime for Storybook
  if (typeof window !== 'undefined' && (window as any).jest) {
    mockAppKitHooks();
  }
  
  return <Story />;
};

// Alternative: Create mock providers that don't require real wallet connection
export const MockAppKitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};