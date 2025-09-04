export interface MessageState {
  lastMessage: any
  error: string | null
}

export interface MessageActions {
  sendMessage: (message: any) => Promise<any>
  clearError: () => void
}

export interface MessageRoutingFacade {
  state: MessageState
  actions: MessageActions
}

export interface ExternalMessageRequest {
  action: string
  data?: any
  [key: string]: any
}

export interface MessageResponse {
  success: boolean
  message?: string
  error?: string
  data?: any
  [key: string]: any
}

class MessageRoutingManager {
  private state: MessageState = {
    lastMessage: null,
    error: null
  }

  private listeners: ((state: MessageState) => void)[] = []
  
  private readonly ALLOWED_ORIGINS = [
    'http://localhost:5173', // Development server
    'http://localhost'       // Local development
  ]

  subscribe(listener: (state: MessageState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private setState(updates: Partial<MessageState>) {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(listener => listener(this.state))
  }

  // External message handler
  handleExternalMessage = (
    request: ExternalMessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ): boolean => {
    try {
      // Verify sender origin
      const senderOrigin = new URL(sender.origin || sender.url || '').origin
      
      if (!this.isOriginAllowed(senderOrigin)) {
        sendResponse({
          success: false,
          error: 'Unauthorized origin',
          data: { origin: senderOrigin }
        })
        return false
      }

      // Route message based on action
      return this.routeExternalMessage(request, sendResponse)
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      })
      return false
    }
  }

  // Internal message handler
  handleInternalMessage = (
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): boolean => {
    try {
      this.setState({ lastMessage: request })

      if (request.from === 'sidePanel') {
        return this.handleSidePanelMessage(request, sendResponse)
      }

      return this.routeInternalMessage(request, sendResponse)
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to process internal message'
      })
      sendResponse({ success: false, error: this.state.error })
      return true
    }
  }

  private isOriginAllowed(origin: string): boolean {
    return this.ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))
  }

  private routeExternalMessage(
    request: ExternalMessageRequest,
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    switch (request.action) {
      case 'openSidePanel':
        return this.handleOpenSidePanel(request, sendResponse)
      
      case 'closeSidePanel':
        return this.handleCloseSidePanel(sendResponse)
      
      case 'isSidePanelOpen':
        return this.handleIsSidePanelOpen(sendResponse)
      
      case 'sendToSidePanel':
        return this.handleSendToSidePanel(request, sendResponse)
      
      case 'ping':
        return this.handlePing(sendResponse)
      
      default:
        sendResponse({
          success: false,
          error: `Unknown action: ${request.action}`
        })
        return false
    }
  }

  private routeInternalMessage(
    request: any,
    sendResponse: (response?: any) => void
  ): boolean {
    switch (request.type) {
      case "START_REDDIT_CAPTURE":
        // This will be handled by the Reddit capture facade
        sendResponse({ success: true })
        return true
      
      case "STOP_REDDIT_CAPTURE":
        // This will be handled by the Reddit capture facade
        sendResponse({ success: true })
        return true
      
      case "GET_REDDIT_DATA":
        // This will be handled by the Reddit capture facade
        sendResponse({ data: null })
        return true
      
      default:
        sendResponse({ success: false, error: 'Unknown message type' })
        return true
    }
  }

  private handleOpenSidePanel(
    request: ExternalMessageRequest,
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    const taskData = { ...request }
    delete taskData.action

    // Use side panel facade to open panel
    import('./side-panel-facade').then(({ sidePanelManager }) => {
      sidePanelManager.open(Object.keys(taskData).length > 0 ? taskData : undefined)
        .then(success => {
          if (success) {
            sendResponse({
              success: true,
              message: 'Side panel opened'
            })
          } else {
            sendResponse({
              success: false,
              error: 'Failed to open side panel'
            })
          }
        })
        .catch(error => {
          sendResponse({
            success: false,
            error: error.message
          })
        })
    })

    return true // Keep channel open for async response
  }

  private handleCloseSidePanel(
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    import('./side-panel-facade').then(({ sidePanelManager }) => {
      sidePanelManager.close()
        .then(success => {
          sendResponse({
            success,
            message: success ? 'Side panel closed' : 'Failed to close side panel'
          })
        })
        .catch(error => {
          sendResponse({
            success: false,
            error: error.message
          })
        })
    })

    return true
  }

  private handleIsSidePanelOpen(
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    // This would require additional browser API support
    sendResponse({
      success: false,
      error: 'Check panel status not supported'
    })
    return false
  }

  private handleSendToSidePanel(
    request: ExternalMessageRequest,
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    browser.runtime.sendMessage({
      from: 'external',
      data: request.data
    })
    .then(response => {
      sendResponse({
        success: true,
        data: response
      })
    })
    .catch(error => {
      sendResponse({
        success: false,
        error: error.message
      })
    })

    return true
  }

  private handlePing(
    sendResponse: (response: MessageResponse) => void
  ): boolean {
    sendResponse({
      success: true,
      message: 'Extension is running',
      data: {
        extensionId: browser.runtime.id,
        version: browser.runtime.getManifest().version,
        sidePanelAvailable: !!browser.sidePanel
      }
    })
    return false
  }

  private handleSidePanelMessage(
    request: any,
    sendResponse: (response?: any) => void
  ): boolean {
    switch (request.action) {
      case 'getStatus':
        sendResponse({
          status: 'ready',
          timestamp: Date.now()
        })
        return true
      
      default:
        return false
    }
  }

  sendMessage = async (message: any): Promise<any> => {
    try {
      const response = await browser.runtime.sendMessage(message)
      this.setState({ lastMessage: message, error: null })
      return response
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to send message'
      })
      throw error
    }
  }

  clearError = (): void => {
    this.setState({ error: null })
  }

  getState(): MessageState {
    return { ...this.state }
  }
}

// Singleton instance
const messageRoutingManager = new MessageRoutingManager()

// Facade hook (for React components)
export const useMessageRouting = (): MessageRoutingFacade => {
  // This would be implemented in React components
  // Background script uses manager directly
  throw new Error('useMessageRouting hook should only be used in React components')
}

// Export manager for background script usage
export { messageRoutingManager }