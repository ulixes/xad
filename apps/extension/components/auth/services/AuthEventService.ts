import { User } from '@privy-io/react-auth'
import { browser } from 'wxt/browser'

export enum AuthEventType {
  AUTHENTICATION_SUCCESS = 'AUTH_SUCCESS',
  AUTHENTICATION_FAILURE = 'AUTH_FAILURE',
  LOGOUT_SUCCESS = 'LOGOUT_SUCCESS',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED'
}

export interface AuthEvent {
  type: AuthEventType
  user?: User | null
  timestamp: number
  source: 'popup' | 'main' | 'background'
}

export class AuthEventService {
  private static instance: AuthEventService
  private listeners: Map<string, Set<(event: AuthEvent) => void>> = new Map()

  private constructor() {
    this.setupBrowserMessageListener()
  }

  static getInstance(): AuthEventService {
    if (!AuthEventService.instance) {
      AuthEventService.instance = new AuthEventService()
    }
    return AuthEventService.instance
  }

  private setupBrowserMessageListener(): void {
    if (browser.runtime?.onMessage) {
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type?.startsWith('AUTH_')) {
          console.log('AuthEventService: Received auth message', message)
          this.handleAuthMessage(message as AuthEvent)
          sendResponse({ success: true })
        }
        return false // Indicate we're sending response synchronously
      })
    }
  }

  private handleAuthMessage(event: AuthEvent): void {
    this.notifyListeners(event.type, event)
  }

  subscribe(eventType: AuthEventType, callback: (event: AuthEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(callback)

    return () => {
      this.listeners.get(eventType)?.delete(callback)
    }
  }

  emit(eventType: AuthEventType, user?: User | null, source: 'popup' | 'main' | 'background' = 'main'): void {
    const event: AuthEvent = {
      type: eventType,
      user,
      timestamp: Date.now(),
      source
    }

    console.log('AuthEventService: Emitting event', event)
    
    this.notifyListeners(eventType, event)

    if (browser.runtime?.sendMessage) {
      browser.runtime.sendMessage(event)
        .then(() => console.log('AuthEventService: Message sent successfully'))
        .catch((err) => {
          console.log('AuthEventService: Failed to send message', err)
        })
    }
  }

  private notifyListeners(eventType: string, event: AuthEvent): void {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in auth event listener for ${eventType}:`, error)
        }
      })
    }
  }
}