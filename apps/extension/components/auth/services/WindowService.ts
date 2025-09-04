import { browser } from 'wxt/browser'
import { 
  WindowServiceInterface, 
  AuthWindowConfig, 
  AuthenticationError, 
  AuthErrorCode 
} from '../types/auth.types'

export class WindowService implements WindowServiceInterface {
  private authWindowId: number | null = null
  
  private readonly defaultConfig: AuthWindowConfig = {
    type: 'panel',
    width: 500,
    height: 600
  }

  async openAuthWindow(config?: AuthWindowConfig): Promise<void> {
    try {
      const windowConfig = { ...this.defaultConfig, ...config }
      
      const authWindow = await browser.windows.create({
        url: browser.runtime.getURL('/auth.html'),
        type: windowConfig.type,
        width: windowConfig.width,
        height: windowConfig.height,
        left: windowConfig.left,
        top: windowConfig.top
      })

      if (authWindow?.id) {
        this.authWindowId = authWindow.id
      }
    } catch (error) {
      throw new AuthenticationError(
        'Failed to open authentication window',
        AuthErrorCode.WINDOW_BLOCKED,
        'Unable to open sign-in window. Please check your popup blocker settings.'
      )
    }
  }

  async closeAuthWindow(): Promise<void> {
    if (!this.authWindowId) return

    try {
      await browser.windows.remove(this.authWindowId)
      this.authWindowId = null
    } catch (error) {
      console.error('Failed to close auth window:', error)
    }
  }

  async isAuthWindowOpen(): Promise<boolean> {
    if (!this.authWindowId) return false

    try {
      const window = await browser.windows.get(this.authWindowId)
      return window !== null
    } catch {
      this.authWindowId = null
      return false
    }
  }
}