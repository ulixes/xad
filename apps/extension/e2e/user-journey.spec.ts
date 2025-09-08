import { test, expect } from './fixtures/extension-test';
import { SidePanelPage } from './pages/SidePanelPage';

test.describe('Complete User Journey', () => {
  test('should complete full authentication and wallet creation flow', async ({ extensionFixture }) => {
    // Clear any existing state
    await extensionFixture.clearExtensionStorage();
    
    // Open side panel
    const page = await extensionFixture.openSidePanel();
    const sidePanelPage = new SidePanelPage(page);
    await sidePanelPage.waitForLoad();
    
    // Step 1: Initial state - not authenticated
    await expect(sidePanelPage.loginButton).toBeVisible();
    await expect(sidePanelPage.userProfile).not.toBeVisible();
    
    // Step 2: Login
    await page.evaluate(() => {
      // Mock successful login
      window.PrivyService = {
        login: () => Promise.resolve({
          id: 'user123',
          email: 'test@example.com',
          wallet: null
        }),
        logout: () => Promise.resolve(),
        createWallet: () => Promise.resolve({
          id: 'wallet-001',
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          type: 'embedded'
        })
      };
    });
    
    await sidePanelPage.login();
    
    // Step 3: Verify authenticated state
    await sidePanelPage.userProfile.waitFor({ state: 'visible', timeout: 10000 });
    await expect(sidePanelPage.logoutButton).toBeVisible();
    await expect(sidePanelPage.createWalletButton).toBeVisible();
    
    // Step 4: Check user email
    const userEmail = await sidePanelPage.getUserEmail();
    expect(userEmail).toContain('test@example.com');
    
    // Step 5: Create first wallet
    const initialWalletCount = await sidePanelPage.getWalletCount();
    expect(initialWalletCount).toBe(0);
    
    await sidePanelPage.createWallet();
    await page.waitForTimeout(1000);
    
    // Step 6: Verify wallet was created
    const newWalletCount = await sidePanelPage.getWalletCount();
    expect(newWalletCount).toBe(1);
    
    const walletAddresses = await sidePanelPage.getWalletAddresses();
    expect(walletAddresses[0]).toMatch(/^0x[a-fA-F0-9]{40}$/);
    
    // Step 7: Test persistence - close and reopen
    await page.close();
    const newPage = await extensionFixture.openSidePanel();
    const newSidePanelPage = new SidePanelPage(newPage);
    await newSidePanelPage.waitForLoad();
    
    // Step 8: Verify state persisted
    const stillAuthenticated = await newSidePanelPage.isAuthenticated();
    expect(stillAuthenticated).toBe(true);
    
    const persistedWalletCount = await newSidePanelPage.getWalletCount();
    expect(persistedWalletCount).toBe(1);
    
    // Step 9: Logout
    await newSidePanelPage.logout();
    await expect(newSidePanelPage.loginButton).toBeVisible();
    await expect(newSidePanelPage.userProfile).not.toBeVisible();
    
    // Step 10: Verify state cleared after logout
    await newPage.close();
    const finalPage = await extensionFixture.openSidePanel();
    const finalSidePanelPage = new SidePanelPage(finalPage);
    await finalSidePanelPage.waitForLoad();
    
    await expect(finalSidePanelPage.loginButton).toBeVisible();
    const finalAuthenticated = await finalSidePanelPage.isAuthenticated();
    expect(finalAuthenticated).toBe(false);
  });
  
  test('should handle error recovery throughout the journey', async ({ extensionFixture }) => {
    await extensionFixture.clearExtensionStorage();
    
    const page = await extensionFixture.openSidePanel();
    const sidePanelPage = new SidePanelPage(page);
    await sidePanelPage.waitForLoad();
    
    // Setup: Mock service with controlled failures
    await page.evaluate(() => {
      let loginAttempts = 0;
      let walletAttempts = 0;
      
      window.PrivyService = {
        login: () => {
          loginAttempts++;
          if (loginAttempts === 1) {
            return Promise.reject(new Error('Network timeout'));
          }
          return Promise.resolve({
            id: 'user123',
            email: 'test@example.com'
          });
        },
        createWallet: () => {
          walletAttempts++;
          if (walletAttempts === 1) {
            return Promise.reject(new Error('Wallet service unavailable'));
          }
          return Promise.resolve({
            id: 'wallet-recovery',
            address: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
            type: 'embedded'
          });
        },
        logout: () => Promise.resolve()
      };
    });
    
    // Step 1: First login attempt fails
    await sidePanelPage.loginButton.click();
    await sidePanelPage.errorAlert.waitFor({ state: 'visible' });
    await expect(sidePanelPage.errorAlert).toContainText(/error/i);
    
    // Step 2: Retry login
    await sidePanelPage.retryButton.click();
    await sidePanelPage.loginButton.click();
    
    // Should succeed this time
    await sidePanelPage.userProfile.waitFor({ state: 'visible', timeout: 10000 });
    
    // Step 3: First wallet creation fails
    await sidePanelPage.createWalletButton.click();
    await sidePanelPage.errorAlert.waitFor({ state: 'visible' });
    
    // Step 4: Retry wallet creation
    await sidePanelPage.retryButton.click();
    await sidePanelPage.createWalletButton.click();
    
    // Should succeed this time
    await page.waitForTimeout(1000);
    const walletCount = await sidePanelPage.getWalletCount();
    expect(walletCount).toBe(1);
  });
});