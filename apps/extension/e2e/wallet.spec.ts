import { test, expect } from './fixtures/extension-test';
import { SidePanelPage } from './pages/SidePanelPage';

test.describe('Wallet Management', () => {
  let sidePanelPage: SidePanelPage;

  test.beforeEach(async ({ extensionFixture }) => {
    // Clear storage
    await extensionFixture.clearExtensionStorage();
    
    // Open side panel
    const page = await extensionFixture.openSidePanel();
    sidePanelPage = new SidePanelPage(page);
    await sidePanelPage.waitForLoad();
    
    // Setup authenticated state for wallet tests
    await page.evaluate(() => {
      // Mock authenticated state
      window.__mockAuthState = {
        user: { id: 'user123', email: 'test@example.com' },
        wallets: [],
        error: null
      };
      
      // Mock wallet creation service
      window.PrivyService = {
        createWallet: () => Promise.resolve({
          id: `wallet-${Date.now()}`,
          address: `0x${Math.random().toString(36).substring(2, 42)}`,
          type: 'embedded'
        })
      };
    });
    
    // Trigger authenticated state
    await page.reload();
    await sidePanelPage.waitForLoad();
  });

  test('should display create wallet button when authenticated', async () => {
    const isAuthenticated = await sidePanelPage.isAuthenticated();
    
    if (isAuthenticated) {
      await expect(sidePanelPage.createWalletButton).toBeVisible();
      await expect(sidePanelPage.createWalletButton).toHaveText(/create wallet/i);
    }
  });

  test('should create a new wallet successfully', async () => {
    const isAuthenticated = await sidePanelPage.isAuthenticated();
    
    if (isAuthenticated) {
      // Get initial wallet count
      const initialCount = await sidePanelPage.getWalletCount();
      
      // Create wallet
      await sidePanelPage.createWallet();
      
      // Wait for wallet to be added
      await sidePanelPage.page.waitForTimeout(1000);
      
      // Check new wallet count
      const newCount = await sidePanelPage.getWalletCount();
      expect(newCount).toBe(initialCount + 1);
      
      // Verify wallet address is displayed
      const addresses = await sidePanelPage.getWalletAddresses();
      expect(addresses.length).toBeGreaterThan(0);
      expect(addresses[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  test('should show loading state during wallet creation', async () => {
    const isAuthenticated = await sidePanelPage.isAuthenticated();
    
    if (isAuthenticated) {
      // Mock slow wallet creation
      await sidePanelPage.page.evaluate(() => {
        window.PrivyService.createWallet = () => 
          new Promise(resolve => setTimeout(() => 
            resolve({
              id: 'wallet-slow',
              address: '0x1234567890123456789012345678901234567890',
              type: 'embedded'
            }), 3000
          ));
      });
      
      // Start wallet creation
      await sidePanelPage.createWalletButton.click();
      
      // Should show loading state
      await expect(sidePanelPage.loadingIndicator).toBeVisible();
      await expect(sidePanelPage.loadingIndicator).toContainText(/creating wallet/i);
      await expect(sidePanelPage.createWalletButton).toBeDisabled();
    }
  });

  test('should handle wallet creation errors', async () => {
    const isAuthenticated = await sidePanelPage.isAuthenticated();
    
    if (isAuthenticated) {
      // Mock wallet creation failure
      await sidePanelPage.page.evaluate(() => {
        window.PrivyService.createWallet = () => 
          Promise.reject(new Error('Insufficient permissions'));
      });
      
      // Attempt to create wallet
      await sidePanelPage.createWalletButton.click();
      
      // Should show error
      await sidePanelPage.errorAlert.waitFor({ state: 'visible' });
      await expect(sidePanelPage.errorAlert).toContainText(/error/i);
    }
  });

  test('should display multiple wallets', async () => {
    const isAuthenticated = await sidePanelPage.isAuthenticated();
    
    if (isAuthenticated) {
      // Create multiple wallets
      for (let i = 0; i < 3; i++) {
        await sidePanelPage.createWallet();
        await sidePanelPage.page.waitForTimeout(500);
      }
      
      // Verify all wallets are displayed
      const walletCount = await sidePanelPage.getWalletCount();
      expect(walletCount).toBe(3);
      
      const addresses = await sidePanelPage.getWalletAddresses();
      expect(addresses.length).toBe(3);
      
      // Verify each address is unique
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(3);
    }
  });

  test('should persist wallets across sessions', async ({ extensionFixture }) => {
    const isAuthenticated = await sidePanelPage.isAuthenticated();
    
    if (isAuthenticated) {
      // Create a wallet
      await sidePanelPage.createWallet();
      const addresses = await sidePanelPage.getWalletAddresses();
      expect(addresses.length).toBe(1);
      
      // Store the address for comparison
      const originalAddress = addresses[0];
      
      // Close and reopen side panel
      await sidePanelPage.page.close();
      const newPage = await extensionFixture.openSidePanel();
      const newSidePanelPage = new SidePanelPage(newPage);
      await newSidePanelPage.waitForLoad();
      
      // Verify wallet is still there
      const newAddresses = await newSidePanelPage.getWalletAddresses();
      expect(newAddresses.length).toBe(1);
      expect(newAddresses[0]).toBe(originalAddress);
    }
  });
});