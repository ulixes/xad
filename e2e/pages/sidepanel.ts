import { Page } from "@playwright/test";

export async function openSidePanel(page: Page, extensionId: string) {
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  
  // Wait for the side panel to load
  await page.waitForLoadState('networkidle');
  
  const sidePanel = {
    // Auth methods
    isAuthenticated: async () => {
      const loginButton = await page.$('[data-testid="login-button"]');
      return loginButton === null;
    },
    
    login: async () => {
      const loginButton = await page.waitForSelector('[data-testid="login-button"]');
      await loginButton.click();
      
      // Wait for email input to appear
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill in test email
      await page.fill('input[type="email"]', 'test-2886@privy.io');
      
      // Wait for form to update
      await page.waitForTimeout(1000);
      
      // Click submit/continue button
      const submitButton = await page.waitForSelector('button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Send code"), button:has-text("Submit")');
      await submitButton.click();
      
      // Wait for OTP input
      await page.waitForSelector('input[type="text"], input[inputmode="numeric"]', { timeout: 10000 });
      
      // Fill in OTP
      await page.fill('input[type="text"], input[inputmode="numeric"]', '613301');
      
      // Click verify/continue
      const verifyButton = await page.waitForSelector('button:has-text("Verify"), button:has-text("Continue"), button:has-text("Sign in")');
      await verifyButton.click();
      
      // Wait for authentication to complete
      await page.waitForSelector('[data-testid="user-profile"]', { timeout: 30000 });
    },
    
    // Task methods
    openAvailableTasks: async () => {
      const viewTasksButton = await page.waitForSelector('button:has-text("View Available Tasks")');
      await viewTasksButton.click();
      await page.waitForSelector('[data-testid="available-tasks-list"]');
    },
    
    claimTask: async () => {
      // Click on the first available task
      const claimButton = await page.waitForSelector('button:has-text("Claim Task")');
      await claimButton.click();
      
      // Wait for the task to be claimed
      await page.waitForResponse(response => 
        response.url().includes('/tasks/claim') && response.status() === 200
      );
    },
    
    tryClaimAnotherTask: async () => {
      // Try to claim another task when one is already active
      const claimButtons = await page.$$('button:has-text("Claim Task")');
      if (claimButtons.length > 0) {
        await claimButtons[0].click();
      }
      
      // Wait for the API response (expecting rejection)
      return await page.waitForResponse(response => 
        response.url().includes('/tasks/claim')
      );
    },
    
    hasActiveTask: async () => {
      const activeTask = await page.$('[data-testid="active-task"]');
      return activeTask !== null;
    },
    
    goToTaskSubmission: async () => {
      const submitTaskButton = await page.waitForSelector('button:has-text("Submit Task")');
      await submitTaskButton.click();
      await page.waitForSelector('[data-testid="task-submission-form"]');
    },
    
    fillTaskEvidence: async (evidence: string) => {
      const evidenceInput = await page.waitForSelector('[data-testid="evidence-input"]');
      await evidenceInput.fill(evidence);
    },
    
    submitTask: async () => {
      const submitButton = await page.waitForSelector('button[type="submit"]:has-text("Submit")');
      await submitButton.click();
      
      // Wait for submission to complete
      await page.waitForResponse(response => 
        response.url().includes('/tasks/submit') && response.status() === 200
      );
    },
    
    getCompletedTaskCount: async () => {
      const completedCount = await page.$eval('[data-testid="completed-tasks-count"]', 
        el => parseInt(el.textContent || '0')
      );
      return completedCount;
    },
    
    waitForElement: async (selector: string, timeout = 10000) => {
      return await page.waitForSelector(selector, { timeout });
    },
    
    getErrorMessage: async () => {
      const errorElement = await page.$('[data-testid="error-message"]');
      if (errorElement) {
        return await errorElement.textContent();
      }
      return null;
    }
  };
  
  return sidePanel;
}