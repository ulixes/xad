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

// Create modal with SIWX authentication  
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata,
  siwx: siwxConfig,
  features: {
    analytics: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-border-radius-master': '0.375rem', // Match your button's rounded-md (6px)
    '--w3m-font-family': 'Inter, system-ui, sans-serif', // Match your app's font
    '--w3m-color-bg-1': '#0a0a0a', // Match your dark background
    '--w3m-color-bg-2': '#1a1a1a', // Match your input/secondary backgrounds
    '--w3m-color-bg-3': '#2a2a2a', // Slightly lighter for hover states
    '--w3m-color-fg-1': '#ededed', // Match your light text color
    '--w3m-color-fg-2': '#b0b0b0', // Slightly dimmed for secondary text
    '--w3m-color-fg-3': '#808080', // Even dimmer for tertiary elements
  }
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