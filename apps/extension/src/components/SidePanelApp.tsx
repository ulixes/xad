import React from 'react';
import { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';
import { VerificationManager } from './VerificationManager';
import { LoginButton } from '@xad/ui';
import { LogoutButton } from '@xad/ui';
import { UserProfile } from '@xad/ui';
import { CreateWalletButton } from '@xad/ui';
import { WalletList } from '@xad/ui';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@xad/ui';
import { Alert, AlertDescription } from '@xad/ui';
import { Button } from '@xad/ui';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function SidePanelApp() {
  const { state, login, logout, createWallet, retry } = usePrivyAuthMachine();

  const isIdle = state.matches('idle');
  const isAuthenticating = state.matches('authenticating');
  const isAuthenticated = state.matches('authenticated');
  const isCreatingWallet = state.matches('creatingWallet');
  const hasError = state.matches('error');

  const { user, wallets, error } = state.context;

  return (
    <div className="h-screen p-4 bg-background" data-testid="app-container">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Microtask Extension</CardTitle>
          <CardDescription>
            Manage your authentication and wallets
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto space-y-4">
          {/* Error State */}
          {hasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error || 'An error occurred'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retry}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Idle/Login State */}
          {(isIdle || hasError) && !isAuthenticated && (
            <div className="space-y-4">
              <LoginButton
                onClick={login}
                loading={isAuthenticating}
                disabled={isAuthenticating}
              />
            </div>
          )}

          {/* Authenticating State */}
          {isAuthenticating && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Authenticating with Privy...
                </p>
                <p className="text-xs text-muted-foreground">
                  Please complete the authentication in the popup window
                </p>
              </div>
            </div>
          )}

          {/* Authenticated State */}
          {isAuthenticated && user && (
            <div className="space-y-4">
              {/* User Profile */}
              <UserProfile
                user={{
                  id: user.id,
                  email: user.email,
                  wallet: user.wallet
                }}
              />

              {/* Verification Manager - Uses @xad/ui only */}
              <VerificationManager />

              {/* Wallet Management - Collapsed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Wallets</h3>
                  <CreateWalletButton
                    onClick={createWallet}
                    loading={isCreatingWallet}
                    disabled={isCreatingWallet}
                    className="w-auto"
                  />
                </div>

                {wallets && wallets.length > 0 ? (
                  <WalletList wallets={wallets} />
                ) : (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    No wallets created yet
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <LogoutButton
                onClick={logout}
                className="w-full"
                variant="outline"
              />
            </div>
          )}

          {/* Creating Wallet State */}
          {isCreatingWallet && (
            <div className="flex items-center justify-center py-4">
              <p className="text-sm text-muted-foreground">
                Creating your wallet...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}