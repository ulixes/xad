import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export class ExtensionFixture {
  context: BrowserContext;
  extensionId: string;

  constructor(context: BrowserContext, extensionId: string) {
    this.context = context;
    this.extensionId = extensionId;
  }

  async openSidePanel() {
    // Open the extension side panel
    const sidePanelUrl = `chrome-extension://${this.extensionId}/sidepanel.html`;
    const page = await this.context.newPage();
    await page.goto(sidePanelUrl);
    await page.waitForLoadState('networkidle');
    return page;
  }

  async openPopup() {
    // Open the extension popup
    const popupUrl = `chrome-extension://${this.extensionId}/popup.html`;
    const page = await this.context.newPage();
    await page.goto(popupUrl);
    await page.waitForLoadState('networkidle');
    return page;
  }

  async getBackgroundPage() {
    // Access the background service worker
    const targets = this.context.serviceWorkers();
    const backgroundTarget = targets.find(
      target => target.url().includes(this.extensionId)
    );
    return backgroundTarget;
  }

  async clearExtensionStorage() {
    // Clear chrome.storage for testing
    const page = await this.context.newPage();
    await page.goto(`chrome-extension://${this.extensionId}/sidepanel.html`);
    await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          chrome.storage.sync.clear(() => {
            resolve(undefined);
          });
        });
      });
    });
    await page.close();
  }
}

export const test = base.extend<{
  extensionFixture: ExtensionFixture;
}>({
  extensionFixture: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../.output/chrome-mv3');
    
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
      ],
      viewport: { width: 400, height: 600 },
    });

    // Get extension ID
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    const extensionId = background.url().split('/')[2];
    const fixture = new ExtensionFixture(context, extensionId);

    await use(fixture);
    await context.close();
  },
});

export { expect } from '@playwright/test';