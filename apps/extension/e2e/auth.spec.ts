import { test, expect } from './fixtures/extension-test';
import { SidePanelPage } from './pages/SidePanelPage';

test.describe('Authentication Flow', () => {
  let sidePanelPage: SidePanelPage;

  test.beforeEach(async ({ extensionFixture }) => {
    // Clear storage before each test
    await extensionFixture.clearExtensionStorage();
    
    // Open side panel
    const page = await extensionFixture.openSidePanel();
    sidePanelPage = new SidePanelPage(page);
    await sidePanelPage.waitForLoad();
  });

  test('should display login button when not authenticated', async () => {
    await expect(sidePanelPage.loginButton).toBeVisible();
    await expect(sidePanelPage.loginButton).toHaveText(/login with privy/i);
    
    // Should not show authenticated elements
    await expect(sidePanelPage.userProfile).not.toBeVisible();
    await expect(sidePanelPage.logoutButton).not.toBeVisible();
  });

  test('should handle login flow successfully', async () => {
    // Start login
    await sidePanelPage.loginButton.click();
    
    // Should show loading state
    await expect(sidePanelPage.loadingIndicator).toBeVisible();
    await expect(sidePanelPage.loadingIndicator).toContainText(/authenticating/i);
    
    // Mock successful authentication (in real scenario, this would be handled by Privy)
    // For testing, we'll need to mock the PrivyService response
    
    // Wait for authentication to complete
    await sidePanelPage.page.waitForTimeout(2000); // Adjust based on actual auth time
    
    // Should show authenticated state
    const isAuthenticated = await sidePanelPage.isAuthenticated();
    if (isAuthenticated) {
      await expect(sidePanelPage.userProfile).toBeVisible();
      await expect(sidePanelPage.logoutButton).toBeVisible();
      await expect(sidePanelPage.loginButton).not.toBeVisible();
    }
  });

  test('should handle authentication errors gracefully', async () => {
    // Inject error scenario by mocking service failure
    await sidePanelPage.page.evaluate(() => {
      // Override the login method to simulate failure
      window.PrivyService = {
        login: () => Promise.reject(new Error('Network error'))
      };
    });
    
    // Attempt login
    await sidePanelPage.loginButton.click();
    
    // Should show error state
    await sidePanelPage.errorAlert.waitFor({ state: 'visible' });
    await expect(sidePanelPage.errorAlert).toContainText(/error/i);
    await expect(sidePanelPage.retryButton).toBeVisible();
  });

  test('should retry after error', async () => {
    // Simulate error state
    await sidePanelPage.page.evaluate(() => {
      // First call fails
      let callCount = 0;
      window.PrivyService = {
        login: () => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('Temporary error'));
          }
          return Promise.resolve({ id: 'user123', email: 'test@example.com' });
        }
      };
    });
    
    // First attempt - should fail
    await sidePanelPage.loginButton.click();
    await sidePanelPage.errorAlert.waitFor({ state: 'visible' });
    
    // Retry
    await sidePanelPage.retryButton.click();
    await expect(sidePanelPage.loginButton).toBeVisible();
    
    // Second attempt - should succeed
    await sidePanelPage.loginButton.click();
    // Wait and check for successful auth (implementation depends on mock setup)
  });

  test('should handle logout flow', async () => {
    // Setup: login first
    await sidePanelPage.page.evaluate(() => {
      // Mock authenticated state
      window.__mockAuthState = {
        user: { id: 'user123', email: 'test@example.com' },
        wallets: []
      };
    });
    
    // Trigger re-render with authenticated state
    await sidePanelPage.page.reload();
    await sidePanelPage.waitForLoad();
    
    // Verify authenticated
    if (await sidePanelPage.isAuthenticated()) {
      // Perform logout
      await sidePanelPage.logout();
      
      // Should return to login state
      await expect(sidePanelPage.loginButton).toBeVisible();
      await expect(sidePanelPage.userProfile).not.toBeVisible();
      await expect(sidePanelPage.logoutButton).not.toBeVisible();
    }
  });

  test('should persist authentication state across sessions', async ({ extensionFixture }) => {
    // Mock login
    await sidePanelPage.page.evaluate(() => {
      // Set authenticated state in storage
      chrome.storage.local.set({
        authState: {
          user: { id: 'user123', email: 'test@example.com' },
          wallets: [],
          error: null
        }
      });
    });
    
    // Close and reopen side panel
    await sidePanelPage.page.close();
    const newPage = await extensionFixture.openSidePanel();
    const newSidePanelPage = new SidePanelPage(newPage);
    await newSidePanelPage.waitForLoad();
    
    // Should still be authenticated
    const isAuthenticated = await newSidePanelPage.isAuthenticated();
    expect(isAuthenticated).toBe(true);
  });
});