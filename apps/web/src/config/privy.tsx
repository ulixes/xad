import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { getNetworkConfig } from './networks'
import { http } from 'viem'

// Get the Privy app ID from environment
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || ''

// Debug logging - always log in production to diagnose issues
console.log('[Privy Init] Starting with config:', {
  appId: privyAppId ? `${privyAppId.substring(0, 10)}...` : 'MISSING',
  hasAppId: !!privyAppId,
  env: import.meta.env.MODE,
  network: import.meta.env.VITE_NETWORK_ENV,
  host: window.location.hostname
})

// Setup React Query client
const queryClient = new QueryClient()

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  // Get network config inside component to ensure it's initialized
  const networkConfig = getNetworkConfig()
  const chain = networkConfig.viemChain
  
  // Create wagmi config for wallet interactions
  const wagmiConfig = createConfig({
    chains: [chain],
    transports: {
      [chain.id]: http(networkConfig.rpcUrl)
    }
  } as any)
  
  // Critical: Check if Privy app ID is configured
  if (!privyAppId) {
    console.error('[Privy] ERROR: VITE_PRIVY_APP_ID is not configured!')
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error: Privy App ID not configured. Please check environment variables.
      </div>
    )
  }
  
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Appearance
        appearance: {
          theme: 'dark',
          accentColor: '#6366F1', // Match your brand color
          logo: 'https://avatars.githubusercontent.com/u/179229932',
        },
        
        // Chain configuration - Privy expects the viem chain object
        defaultChain: chain,
        supportedChains: [chain],
        
        // Login methods - WALLET ONLY
        loginMethods: [
          'wallet',  // External wallet connection only (MetaMask, Coinbase Wallet, etc.)
          // No email, no OAuth, wallet-only authentication
        ],
        
        // Embedded wallets - DISABLED
        // Users must connect their own external wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Don't create for users with wallets
          showWalletUIs: false, // Hide embedded wallet UI
        },

        // Custom text
        loginMessage: 'Sign in to zkAD',

        // Disable wallet detection logs
        _disableWalletDetectionPolling: true,

        // Events
        onSuccess: (user: any) => {
          console.log('Privy login success:', user)
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}