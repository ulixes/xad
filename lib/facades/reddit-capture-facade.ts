export interface RedditProfile {
  username: string
  foundVia: string
  operation: string
  timestamp: number
}

export interface RedditCaptureState {
  isCapturing: boolean
  profileData: RedditProfile | null
  error: string | null
}

export interface RedditCaptureActions {
  startCapture: () => void
  stopCapture: () => void
  clearError: () => void
}

export interface RedditCaptureFacade {
  state: RedditCaptureState
  actions: RedditCaptureActions
}

class RedditCaptureManager {
  private state: RedditCaptureState = {
    isCapturing: false,
    profileData: null,
    error: null
  }

  private listeners: ((state: RedditCaptureState) => void)[] = []
  private captureListener: ((details: any) => void) | null = null
  private captureTimeout: NodeJS.Timeout | null = null

  private readonly REDDIT_GRAPHQL_URLS = [
    "*://www.reddit.com/svc/shreddit/graphql*",
    "*://reddit.com/svc/shreddit/graphql*"
  ]

  private readonly CAPTURE_TIMEOUT = 30000 // 30 seconds

  subscribe(listener: (state: RedditCaptureState) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private setState(updates: Partial<RedditCaptureState>) {
    this.state = { ...this.state, ...updates }
    this.listeners.forEach(listener => listener(this.state))
  }

  startCapture = (): void => {
    if (this.state.isCapturing) {
      return
    }

    this.setState({
      isCapturing: true,
      profileData: null,
      error: null
    })

    try {
      this.captureListener = this.handleGraphQLRequest.bind(this)
      
      if (!browser.webRequest?.onBeforeRequest) {
        throw new Error("WebRequest API not available")
      }

      browser.webRequest.onBeforeRequest.addListener(
        this.captureListener,
        { urls: this.REDDIT_GRAPHQL_URLS },
        ["requestBody"]
      )

      // Set timeout
      this.captureTimeout = setTimeout(() => {
        if (this.state.isCapturing) {
          this.setState({
            error: "Timeout - no profile data captured after 30 seconds"
          })
          this.stopCapture()
          browser.runtime.sendMessage({ type: "REDDIT_CAPTURE_TIMEOUT" })
        }
      }, this.CAPTURE_TIMEOUT)

    } catch (error) {
      this.setState({
        isCapturing: false,
        error: error instanceof Error ? error.message : "Failed to start capture"
      })
    }
  }

  stopCapture = (): void => {
    this.setState({ isCapturing: false })

    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout)
      this.captureTimeout = null
    }

    if (this.captureListener && browser.webRequest?.onBeforeRequest) {
      try {
        browser.webRequest.onBeforeRequest.removeListener(this.captureListener)
      } catch (error) {
      }
      this.captureListener = null
    }
  }

  clearError = (): void => {
    this.setState({ error: null })
  }

  private handleGraphQLRequest(details: any): void {
    if (!this.state.isCapturing) return

    try {
      const requestData = this.parseRequestBody(details)
      if (!requestData) return

      // Look for TrophyCategories operation which contains username
      if (requestData.operation === 'TrophyCategories' && requestData.variables?.name) {
        const profileData = this.normalizeRedditData(requestData)
        
        if (profileData) {
          this.setState({ profileData })
          
          browser.runtime.sendMessage({
            type: "REDDIT_PROFILE_CAPTURED",
            data: profileData
          }).catch(error => {
          })

          this.stopCapture()
        }
      }
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : "Failed to process request"
      })
    }
  }

  private parseRequestBody(details: any): any {
    if (!details.requestBody?.raw?.[0]?.bytes) {
      return null
    }

    try {
      const decoder = new TextDecoder()
      const bodyText = decoder.decode(details.requestBody.raw[0].bytes)
      return JSON.parse(bodyText)
    } catch (error) {
      throw new Error("Failed to parse request body")
    }
  }

  private normalizeRedditData(requestData: any): RedditProfile | null {
    if (!requestData?.variables?.name) {
      return null
    }

    return {
      username: requestData.variables.name,
      foundVia: 'graphql-request',
      operation: requestData.operation,
      timestamp: Date.now()
    }
  }

  getState(): RedditCaptureState {
    return { ...this.state }
  }
}

// Singleton instance
const redditCaptureManager = new RedditCaptureManager()

// Facade hook (for React components)
export const useRedditCapture = (): RedditCaptureFacade => {
  // This would be implemented in React components
  // Background script uses manager directly
  throw new Error('useRedditCapture hook should only be used in React components')
}

// Export manager for background script usage
export { redditCaptureManager }