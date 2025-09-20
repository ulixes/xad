import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { getNetworkConfig } from './networks'
import { http } from 'viem'

// Get the Privy app ID from environment
const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || ''

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
        
        // Login methods - EMAIL ONLY
        loginMethods: [
          'email',  // Email login with OTP only
          // No Google OAuth, no external wallets
        ],
        
        // Embedded wallets - ALWAYS create for ALL users
        // Every user gets an embedded wallet, no exceptions
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users', // Changed from 'users-without-wallets'
          },
          showWalletUIs: true,
        },
        
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