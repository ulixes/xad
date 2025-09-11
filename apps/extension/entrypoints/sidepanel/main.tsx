import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Home } from '@xad/ui';
import './style.css';
import { Platform, SocialAccount, User, UserStatus } from '@/src/types';
import { adaptSocialAccountsForUI } from '@/src/utils/adapters';
import { portoWallet } from '@/src/services/PortoWallet';

const App = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [mockUser] = useState<User>(() => ({
    id: crypto.randomUUID(),
    email: 'user@example.com',
    status: UserStatus.VERIFIED,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    wallet_address: null,
    metadata: { preferences: { notifications: true } },
    pendingEarnings: 12.45,
    availableEarnings: 67.89,
    dailyActionsCompleted: 3,
    dailyActionsRequired: 10,
    socialAccounts: [
      {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        platform: Platform.INSTAGRAM,
        handle: 'johndoe',
        platform_user_id: '123456789',
        is_verified: true,
        last_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        user_id: crypto.randomUUID(),
        platform: Platform.INSTAGRAM,
        handle: 'jane_creator',
        platform_user_id: '987654321',
        is_verified: false,
        last_verified_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }));

  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(mockUser.socialAccounts);

  // Check wallet connection on mount
  useEffect(() => {
    const checkWallet = async () => {
      const account = await portoWallet.getAccount();
      if (account?.isConnected) {
        setWalletAddress(account.address);
      }
    };
    checkWallet();
  }, []);

  // Listen for messages from background script
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.type === 'igDataCollected') {
        const { metadata, platform_user_id } = message.payload;
        console.log('Instagram data collected:', metadata);
        
        // Update the temporary account with real data
        setSocialAccounts(prev => prev.map(account => {
          if (account.platform_user_id === 'temp') {
            return {
              ...account,
              platform_user_id,
              is_verified: true,
              last_verified_at: new Date().toISOString(),
              metadata
            };
          }
          return account;
        }));
      } else if (message.type === 'collectionError') {
        console.error('Collection error:', message.payload);
        // Remove temporary accounts on error
        setSocialAccounts(prev => prev.filter(account => account.platform_user_id !== 'temp'));
      }
    };

    browser.runtime.onMessage.addListener(messageListener);
    
    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return (
    <Home
      // Earnings data
      pendingEarnings={mockUser.pendingEarnings}
      availableEarnings={mockUser.availableEarnings}
      dailyActionsCompleted={mockUser.dailyActionsCompleted}
      dailyActionsRequired={mockUser.dailyActionsRequired}

      // Wallet
      walletAddress={walletAddress}

      // Connected accounts
      connectedAccounts={adaptSocialAccountsForUI(socialAccounts)}

      // Mock handlers
      onAddAccount={(platform: string, handle: string) => {
        // Add temporary account with isAdding state
        const tempAccount: SocialAccount = {
          id: crypto.randomUUID(),
          user_id: mockUser.id,
          platform: Platform.INSTAGRAM,
          handle: handle,
          platform_user_id: 'temp',
          is_verified: false,
          last_verified_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setSocialAccounts(prev => [...prev, tempAccount]);

        // Send message to background script
        browser.runtime.sendMessage({
          type: 'addIgAccount',
          handle: handle
        }).catch((error) => {
          console.error('Failed to send add account message:', error);
          // Remove temp account on error
          setSocialAccounts(prev => prev.filter(acc => acc.id !== tempAccount.id));
        });
      }}

      onAccountClick={(account: any) => {
        console.log('Mock account clicked:', account);
      }}

      onWalletClick={async () => {
        if (walletAddress) {
          // Disconnect
          await portoWallet.disconnect();
          setWalletAddress(null);
        } else {
          // Connect
          setIsConnecting(true);
          try {
            const address = await portoWallet.connect();
            if (address) {
              setWalletAddress(address);
            }
          } catch (error) {
            console.error('Failed to connect wallet:', error);
          } finally {
            setIsConnecting(false);
          }
        }
      }}

      onJackpotClick={() => {
        console.log('Mock jackpot clicked');
      }}

      onCashOut={() => {
        console.log('Mock cash out');
      }}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
