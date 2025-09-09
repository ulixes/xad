import React from 'react';
import ReactDOM from 'react-dom/client';
import { Home } from '@xad/ui';
import { useUserMachine } from '../../src/hooks/useUserMachine';
import '@xad/ui/styles';
import './style.css';

const App = () => {
  const user = useUserMachine();

  // Show loading state
  if (user.isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (user.isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-4">
          <h2 className="text-xl font-semibold mb-2">Failed to Load</h2>
          <p className="text-gray-500 mb-4">{user.systemError}</p>
          <button 
            onClick={user.retryLoad}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Map our state machine data to the existing Home component props
  // The Home component expects the old interface, so we need to adapt
  return (
    <Home
      // Earnings data
      pendingEarnings={user.pendingEarnings}
      availableEarnings={user.availableEarnings}
      dailyActionsCompleted={user.dailyActionsCompleted}
      dailyActionsRequired={user.dailyActionsRequired}
      
      // Wallet
      walletAddress={user.walletAddress}
      
      // Transform accounts data to match expected format
      connectedAccounts={user.accounts.map(account => ({
        platform: account.platform,
        handle: account.handle,
        availableActions: account.availableActions,
        isVerifying: account.isVerifying || account.isRetrying
      }))}
      
      // Handle account addition through state machine
      onAddAccount={(platform: string, handle: string) => {
        // Since our new flow is different, we need to handle this in steps
        if (!user.isAddingAccount) {
          user.startAddAccount(platform);
          // Set handle and submit immediately for compatibility
          setTimeout(() => {
            user.updateHandle(handle);
            setTimeout(() => {
              user.submitHandle();
            }, 10);
          }, 10);
        }
      }}
      
      // Map other callbacks
      onAccountClick={(account: any) => {
        // Find the account by platform and handle
        const accountId = `${account.platform}-${account.handle}`;
        user.clickAccount(accountId);
      }}
      
      onWalletClick={user.clickWallet}
      onJackpotClick={() => console.log('Jackpot clicked')}
      onCashOut={user.cashOut}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);