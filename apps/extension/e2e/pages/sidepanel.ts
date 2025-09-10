import { Page } from "@playwright/test";

export async function openSidePanel(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await page.waitForLoadState('networkidle');

  const sidePanel = {
    // Platform-specific Add Account button (Plus icon)
    getAddAccountButton: (platform: string = 'Instagram') => {
      // Find the platform section and get its Plus button
      return page.locator(`span:has-text("${platform}") + button`);
    },
    
    clickAddAccount: async (platform: string = 'Instagram') => {
      const button = sidePanel.getAddAccountButton(platform);
      await button.click();
    },

    // Form elements (appears after clicking Plus button)
    getUsernameInput: () => page.locator('input[placeholder="Enter handle"]'),
    getSubmitButton: () => page.locator('button:has-text("Add")'),

    // Form actions
    enterUsername: async (username: string) => {
      const input = sidePanel.getUsernameInput();
      await input.fill(username);
    },

    submitForm: async () => {
      // Can submit either by clicking Add button or pressing Enter
      const input = sidePanel.getUsernameInput();
      await input.press('Enter');
    },

    // Account status elements - based on actual UI structure
    getAccountItem: (username: string) => page.locator(`button:has(span:text("@${username}"))`),
    getVerificationStatus: (username: string) => page.locator(`button:has(span:text("@${username}")) >> text=Verifying...`),
    getAvailableActions: (username: string) => page.locator(`button:has(span:text("@${username}")) >> text=/\\d+ available actions/`),
    getLoadingSpinner: (username: string) => page.locator(`button:has(span:text("@${username}")) >> [data-testid="loader"], .animate-spin`),

    // Helper methods
    waitForAccountToAppear: async (username: string) => {
      await page.waitForSelector(`button:has(span:text("@${username}"))`, { timeout: 10000 });
    },

    waitForVerificationStart: async (username: string) => {
      // Wait for the account button to show "Verifying..." text
      await page.waitForSelector(`button:has(span:text("@${username}")) >> text=Verifying...`, { timeout: 10000 });
    },

    waitForVerificationComplete: async (username: string) => {
      // Wait for the account to show available actions instead of "Verifying..."
      await page.waitForSelector(`button:has(span:text("@${username}")) >> text=/\\d+ available actions/`, { timeout: 30000 });
    },

    isAccountVerifying: async (username: string) => {
      const verifyingText = sidePanel.getVerificationStatus(username);
      return await verifyingText.isVisible();
    },

    isAccountVerified: async (username: string) => {
      const actionsText = sidePanel.getAvailableActions(username);
      return await actionsText.isVisible();
    },
  };

  return sidePanel;
}