import { Page, Locator } from '@playwright/test';

export class SidePanelPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly createWalletButton: Locator;
  readonly userProfile: Locator;
  readonly walletList: Locator;
  readonly errorAlert: Locator;
  readonly retryButton: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Auth elements
    this.loginButton = page.getByRole('button', { name: /login with privy/i });
    this.logoutButton = page.getByRole('button', { name: /logout/i });
    
    // Wallet elements
    this.createWalletButton = page.getByRole('button', { name: /create wallet/i });
    this.walletList = page.getByTestId('wallet-list');
    
    // User elements
    this.userProfile = page.getByTestId('user-profile');
    
    // Error handling
    this.errorAlert = page.getByRole('alert');
    this.retryButton = page.getByRole('button', { name: /retry/i });
    
    // Loading states
    this.loadingIndicator = page.getByText(/authenticating|creating wallet/i);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="app-container"], .h-screen', { 
      timeout: 10000 
    });
  }

  async login() {
    await this.loginButton.click();
    // Wait for authentication to complete
    await this.page.waitForFunction(
      () => !document.querySelector('text=/authenticating/i'),
      { timeout: 30000 }
    );
  }

  async logout() {
    await this.logoutButton.click();
    await this.loginButton.waitFor({ state: 'visible' });
  }

  async createWallet() {
    await this.createWalletButton.click();
    // Wait for wallet creation to complete
    await this.page.waitForFunction(
      () => !document.querySelector('text=/creating wallet/i'),
      { timeout: 30000 }
    );
  }

  async getWalletCount(): Promise<number> {
    const wallets = await this.page.$$('[data-testid="wallet-item"]');
    return wallets.length;
  }

  async getWalletAddresses(): Promise<string[]> {
    const addresses = await this.page.$$eval(
      '[data-testid="wallet-address"]',
      elements => elements.map(el => el.textContent || '')
    );
    return addresses;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.userProfile.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  async getUserEmail(): Promise<string | null> {
    const emailElement = await this.page.$('[data-testid="user-email"]');
    if (!emailElement) return null;
    return await emailElement.textContent();
  }

  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return await this.errorAlert.textContent();
    }
    return null;
  }

  async retryAfterError() {
    if (await this.hasError()) {
      await this.retryButton.click();
    }
  }
}