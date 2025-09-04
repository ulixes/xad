import { useState, useCallback } from 'react'
import { ClipboardService } from '../services/ClipboardService'
import { ClipboardState } from '../types/auth.types'

const CLIPBOARD_TIMEOUT = 2000

export const useClipboard = () => {
  const [clipboardService] = useState(() => new ClipboardService())
  const [clipboardState, setClipboardState] = useState<ClipboardState>({
    copiedAddress: null,
    copiedWalletAddress: null
  })

  const copyAddress = useCallback(async (address: string, isWallet = false) => {
    try {
      await clipboardService.copyToClipboard(address)
      
      setClipboardState(prev => ({
        ...prev,
        [isWallet ? 'copiedWalletAddress' : 'copiedAddress']: address
      }))

      setTimeout(() => {
        setClipboardState(prev => ({
          ...prev,
          [isWallet ? 'copiedWalletAddress' : 'copiedAddress']: null
        }))
      }, CLIPBOARD_TIMEOUT)
      
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }, [clipboardService])

  const readClipboard = useCallback(async () => {
    try {
      return await clipboardService.readFromClipboard()
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      return null
    }
  }, [clipboardService])

  return {
    ...clipboardState,
    copyAddress,
    readClipboard,
    isClipboardAvailable: clipboardService.isClipboardAvailable()
  }
}