import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { ReactNode } from 'react'
import { getNetworkConfig } from './networks'
import { siwxConfig } from './siwx'
import { base, baseSepolia } from '@reown/appkit/networks'

// Setup queryClient
const queryClient = new QueryClient()

// Get projectId from environment or use a default for localhost
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '9e00be111bf9590d6e97cb80cde0bd45'

// Get network configuration based on environment
const networkConfig = getNetworkConfig()

// Create a metadata object
const metadata = {
  name: 'zkad',
  description: 'zkad - Privacy-preserving social media advertising',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://zkad.io',
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// Set the networks - environment based  
const networks = networkConfig.network === base ? [base] : [baseSepolia]

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

// Clear stale SIWX sessions on init (not wallet connection)
// This prevents persistent stale data issues
if (typeof window !== 'undefined') {
  // Manually clear SIWX-related localStorage keys
  try {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        // Remove SIWX session data but keep wallet connection data
        if (key.includes('@appkit/siwx') || 
            key.includes('appkit-siwx') ||
            key.includes('@reown/appkit-siwx')) {
          keysToRemove.push(key)
        }
      }
    }
    
    // Remove the identified keys
    keysToRemove.forEach(key => {
      console.log('Clearing stale SIWX session:', key)
      localStorage.removeItem(key)
    })
  } catch (error) {
    console.error('Error clearing SIWX sessions:', error)
  }
}

// Create modal with SIWX authentication  
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata,
  siwx: siwxConfig,
  // enableReconnect defaults to true - keep wallets connected across page loads
  features: {
    analytics: true,
    swaps: false,  // Disable swaps feature
    onramp: false, // Disable onramp feature
    email: false   // Disable email login
  },
  themeMode: 'dark'
})

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export { wagmiAdapter }