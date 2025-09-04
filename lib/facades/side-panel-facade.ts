export interface SidePanelState {
  isOpen: boolean
  error: string | null
  lastTaskData: any
}

export interface SidePanelActions {
  open: (taskData?: any) => Promise<boolean>
  close: () => Promise<boolean>
  sendData: (data: any) => Promise<boolean>
  clearError: () => void
}

export interface SidePanelFacade {
  state: SidePanelState
  actions: SidePanelActions
}

class SidePanelManager {
  private state: SidePanelState = {
    isOpen: false,
    error: null,
    lastTaskData: null
  }

  private listeners: ((state: SidePanelState) => void)[] = []

  subscribe(listener: (state: SidePanelState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private setState(updates: Partial<SidePanelState>) {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(listener => listener(this.state))
  }

  open = async (taskData?: any): Promise<boolean> => {
    try {
      if (!browser.sidePanel) {
        throw new Error('Side panel API not available')
      }

      // Store task data if provided
      if (taskData) {
        this.setState({ lastTaskData: taskData })
        await browser.storage.local.set({ currentTask: taskData })
      }

      // Get current window and open side panel
      const window = await browser.windows.getCurrent()
      
      return new Promise((resolve) => {
        browser.sidePanel.open({ windowId: window.id }, () => {
          if (browser.runtime.lastError) {
            // Fallback: Try without parameters
            browser.sidePanel.open({}, () => {
              if (browser.runtime.lastError) {
                this.setState({
                  error: browser.runtime.lastError.message || 'Failed to open side panel'
                })
                resolve(false)
              } else {
                this.handleSuccessfulOpen(taskData)
                resolve(true)
              }
            })
          } else {
            this.handleSuccessfulOpen(taskData)
            resolve(true)
          }
        })
      })
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to open side panel'
      })
      return false
    }
  }

  private readonly MESSAGE_DELAY_MS = 100 // Brief delay to ensure side panel is ready

  private handleSuccessfulOpen(taskData?: any) {
    this.setState({ isOpen: true, error: null })
    
    // Send task data to side panel after it opens
    if (taskData) {
      setTimeout(() => {
        browser.runtime.sendMessage({
          from: 'background',
          taskData: taskData
        }).catch(() => {})
      }, this.MESSAGE_DELAY_MS)
    }
  }

  close = async (): Promise<boolean> => {
    try {
      if (!browser.sidePanel?.close) {
        throw new Error('Close side panel not supported')
      }

      await browser.sidePanel.close()
      this.setState({ isOpen: false, error: null })
      return true
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to close side panel'
      })
      return false
    }
  }

  sendData = async (data: any): Promise<boolean> => {
    try {
      await browser.runtime.sendMessage({
        from: 'background',
        data: data
      })
      return true
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to send data to side panel'
      })
      return false
    }
  }

  clearError = (): void => {
    this.setState({ error: null })
  }

  // Handle action button click
  handleActionClick = async (): Promise<void> => {
    await this.open()
  }

  getState(): SidePanelState {
    return { ...this.state }
  }
}

// Singleton instance
const sidePanelManager = new SidePanelManager()

// Facade hook (for React components)
export const useSidePanel = (): SidePanelFacade => {
  // This would be implemented in React components
  // Background script uses manager directly
  throw new Error('useSidePanel hook should only be used in React components')
}

// Export manager for background script usage
export { sidePanelManager }