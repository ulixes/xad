import { ClipboardServiceInterface } from '../types/auth.types'

export class ClipboardService implements ClipboardServiceInterface {
  async copyToClipboard(text: string): Promise<void> {
    if (!text) {
      throw new Error('Cannot copy empty text to clipboard')
    }

    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      throw new Error(`Failed to copy to clipboard: ${error}`)
    }
  }

  async readFromClipboard(): Promise<string> {
    try {
      return await navigator.clipboard.readText()
    } catch (error) {
      throw new Error(`Failed to read from clipboard: ${error}`)
    }
  }

  isClipboardAvailable(): boolean {
    return 'clipboard' in navigator && 
           'writeText' in navigator.clipboard
  }
}