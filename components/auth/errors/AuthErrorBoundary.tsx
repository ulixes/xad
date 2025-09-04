import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AuthenticationError, AuthErrorCode } from '../types/auth.types'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught:', error, errorInfo)
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    const isAuthError = error instanceof AuthenticationError
    const errorData = {
      message: error.message,
      code: isAuthError ? error.code : 'UNKNOWN',
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    }
    
    console.error('Error logged to service:', errorData)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  private getErrorMessage(error: Error): string {
    if (error instanceof AuthenticationError) {
      return error.userMessage || error.message
    }
    return 'An unexpected error occurred. Please try again.'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <div className="p-4 border border-red-500 rounded-lg bg-red-50">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Authentication Error
          </h2>
          <p className="text-red-600 mb-4">
            {this.getErrorMessage(this.state.error)}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}