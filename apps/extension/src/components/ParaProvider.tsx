import React, { createContext, useContext, useEffect, useState } from 'react'
import { ParaProvider as ParaSDKProvider } from '@getpara/react-sdk'
import { chromeStorageOverrides } from '@/src/services/chromeStorage'

interface ParaContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  walletAddress: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const ParaContext = createContext<ParaContextValue | undefined>(undefined)

export function useParaAuth() {
  const context = useContext(ParaContext)
  if (!context) {
    throw new Error('useParaAuth must be used within ParaProvider')
  }
  return context
}

interface ParaProviderProps {
  children: React.ReactNode
}

export function ParaProvider({ children }: ParaProviderProps) {
  const apiKey = import.meta.env.VITE_PARA_API_KEY || ''

  // Configure Para for Chrome extension
  const paraConfig = {
    apiKey,
    options: {
      ...chromeStorageOverrides,
      useStorageOverrides: true,
    }
  }

  // Modal configuration for Para
  const modalConfig = {
    authLayout: ['AUTH_FULL', 'EXTERNAL_FULL'] as const,
    theme: {
      mode: 'light' as const,
      foregroundColor: '#000000',
      backgroundColor: '#FFFFFF',
      accentColor: '#007AFF'
    },
    logo: '/icon-128.png' // Extension icon
  }

  return (
    <ParaSDKProvider 
      config={paraConfig}
      paraModalConfig={modalConfig}
    >
      {children}
    </ParaSDKProvider>
  )
}