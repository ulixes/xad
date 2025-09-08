import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@xad/ui';
import { Alert, AlertDescription, AlertTitle } from '@xad/ui';
import { Button } from '@xad/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen p-4 bg-background flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p className="text-sm">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reload Extension
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AuthStateManager({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}