import { Page } from "@playwright/test";
import { loginWithCredentials } from "../authUtils";

export async function authenticateUser(page: Page) {
  // Use existing auth utils or mock authentication
  const testEmail = "test@example.com";
  const testOtp = "123456";
  
  // Mock authentication by setting localStorage or session storage
  await page.goto("/sidepanel.html");
  
  // Set mock authentication state
  await page.evaluate(() => {
    // Mock Privy user state
    localStorage.setItem('privy:connected_account', JSON.stringify({
      id: 'test-user-123',
      email: 'test@example.com',
      authenticated: true
    }));
    
    // Mock auth token
    localStorage.setItem('privy:token', 'mock-jwt-token');
  });
  
  // Alternatively, if we need to go through full auth flow:
  // await loginWithCredentials(page, testEmail, testOtp);
}

interface MockAPIOptions {
  url: string;
  method?: string;
  response: any;
  delay?: number;
}

export async function mockAPI(page: Page, options: MockAPIOptions) {
  const { url, method = "GET", response, delay = 0 } = options;
  
  await page.route(url, async (route) => {
    // Add delay if specified
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Handle different response formats
    if (typeof response === 'object' && 'status' in response) {
      // Response with custom status code
      await route.fulfill({
        status: response.status,
        contentType: "application/json",
        body: JSON.stringify(response.body || {}),
      });
    } else {
      // Normal successful response
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    }
  });
}

export async function waitForCashoutCard(page: Page) {
  // Wait for the cashout progress card to be visible
  const cardTitle = page.getByText("Cashout Progress");
  await cardTitle.waitFor({ state: "visible", timeout: 10000 });
  return cardTitle;
}

export async function mockMultipleAPIs(page: Page, mocks: MockAPIOptions[]) {
  for (const mock of mocks) {
    await mockAPI(page, mock);
  }
}