import { Page, expect } from '@playwright/test';

export async function navigateToTasks(page: Page): Promise<void> {
  // First, wait for the page to settle after login
  await page.waitForTimeout(2000);
  
  // Find the "View Available Tasks" button
  const viewAvailableTasksButton = page.locator('button:has-text("View Available Tasks")');
  
  // Scroll the button into view if needed
  await viewAvailableTasksButton.scrollIntoViewIfNeeded();
  
  // Wait a moment for scroll to complete
  await page.waitForTimeout(500);
  
  await expect(viewAvailableTasksButton).toBeVisible({ timeout: 10000 });
  await viewAvailableTasksButton.click();

  const availableTasksHeader = page.locator('h1:has-text("Available Tasks")');
  await expect(availableTasksHeader).toBeVisible({ timeout: 10000 });
}

export async function verifyTaskList(page: Page): Promise<void> {
  // Verify refresh button
  const refreshButton = page.locator('button:has-text("Refresh Tasks")');
  await expect(refreshButton).toBeVisible();

  // Verify back button
  const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
  await expect(backButton).toBeVisible();

  // Wait for tasks to potentially load
  await page.waitForTimeout(2000);

  // Verify tasks or no-tasks message
  const taskElements = page.locator('[class*="border-2"][class*="shadow-"]').filter({ hasText: /@/ });
  const noTasksMessage = page.locator('text="No Tasks Available"');
  await expect(taskElements.first().or(noTasksMessage)).toBeVisible({ timeout: 10000 });
}

export async function returnToMainPanel(page: Page): Promise<void> {
  const backButton = page.locator('button').filter({ has: page.locator('svg') }).first();
  await backButton.click();

  const userProfile = page.locator('[data-testid="user-profile"]');
  await expect(userProfile).toBeVisible({ timeout: 5000 });
}

export async function claimFirstAvailableTask(page: Page): Promise<void> {
  // Wait for tasks to load
  await page.waitForTimeout(2000);
  
  // Look for claim buttons that are not disabled
  const claimButton = page.locator('button:has-text("Claim $")').first();
  await expect(claimButton).toBeVisible({ timeout: 10000 });
  
  // Verify button is not disabled
  await expect(claimButton).toBeEnabled();
  
  // Click the claim button
  await claimButton.click();
  
  // Wait for claiming process - button should show "Claiming..."
  const claimingButton = page.locator('button:has-text("Claiming...")');
  await expect(claimingButton).toBeVisible({ timeout: 5000 });
}

export async function verifyTaskClaimed(page: Page): Promise<void> {
  // Should navigate back to main panel automatically
  const userProfile = page.locator('[data-testid="user-profile"]');
  await expect(userProfile).toBeVisible({ timeout: 15000 });
  
  // Should show an active task in the task panel
  const activeTaskSection = page.locator('h2:has-text("Active Task")');
  await expect(activeTaskSection).toBeVisible({ timeout: 10000 });
}

export async function verifyClaimError(page: Page): Promise<void> {
  // Should show claim error message
  const errorAlert = page.locator('[class*="border-red-500"]', { hasText: 'Failed to claim task' });
  await expect(errorAlert).toBeVisible({ timeout: 10000 });
  
  // Should have dismiss button
  const dismissButton = page.locator('button:has-text("Dismiss")');
  await expect(dismissButton).toBeVisible();
  
  // Click dismiss to clear error
  await dismissButton.click();
  
  // Error should disappear
  await expect(errorAlert).not.toBeVisible({ timeout: 5000 });
}

export async function verifyNoTasksAvailable(page: Page): Promise<void> {
  const noTasksMessage = page.locator('text="No Tasks Available"');
  await expect(noTasksMessage).toBeVisible({ timeout: 10000 });
  
  const checkAgainButton = page.locator('button:has-text("Check Again")');
  await expect(checkAgainButton).toBeVisible();
}

export async function navigateToTaskSubmission(page: Page): Promise<void> {
  // Find and click the Submit Task button on active task
  const submitTaskButton = page.locator('button:has-text("Submit Task")');
  await expect(submitTaskButton).toBeVisible({ timeout: 10000 });
  await submitTaskButton.click();
  
  // Should show submission guidelines page
  const guidelinesHeader = page.locator('h2:has-text("Submission Guidelines")');
  await expect(guidelinesHeader).toBeVisible({ timeout: 10000 });
}

export async function proceedFromGuidelines(page: Page): Promise<void> {
  // Verify guidelines content is present
  const howItWorksSection = page.locator('text="How It Works"');
  await expect(howItWorksSection).toBeVisible();
  
  const payoutSection = page.locator('text="Payout Information"');
  await expect(payoutSection).toBeVisible();
  
  const warningSection = page.locator('text="Important Notice"');
  await expect(warningSection).toBeVisible();
  
  // Click continue button
  const continueButton = page.locator('button:has-text("I Understand, Continue")');
  await expect(continueButton).toBeVisible();
  await continueButton.click();
  
  // Should show proof submission page
  const proofHeader = page.locator('h2:has-text("Submit Proof of Completion")');
  await expect(proofHeader).toBeVisible({ timeout: 10000 });
}

export async function verifyProofSteps(page: Page): Promise<void> {
  // Verify proof generation steps are shown
  const proofStepsHeader = page.locator('h3:has-text("Proof Generation Steps")');
  await expect(proofStepsHeader).toBeVisible();
  
  // Check for the three steps using contains text
  const step1 = page.getByText('Confirm you have already liked the target tweet');
  await expect(step1).toBeVisible();
  
  const step2 = page.getByText('Go to your profile page on X.com');
  await expect(step2).toBeVisible();
  
  const step3 = page.getByText('navigate to the "Likes" tab');
  await expect(step3).toBeVisible();
}

export async function simulateProofGeneration(page: Page): Promise<void> {
  // Simulate the extension messages that would normally come from browser extension
  // The Proof component listens for browser.runtime.onMessage, so we need to simulate that
  await page.evaluate(() => {
    // Check if browser.runtime exists (it should in extension context)
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
      // Simulate user profile detection
      const profileMessage = {
        type: "user-opened-x-profile",
        user: { handle: "testuser" }
      };
      // Trigger the message handler directly
      browser.runtime.onMessage._listeners?.forEach((listener: any) => {
        listener(profileMessage);
      });
      
      // Simulate likes view confirmation
      const likesMessage = {
        type: "user-opened-likes-view"
      };
      browser.runtime.onMessage._listeners?.forEach((listener: any) => {
        listener(likesMessage);
      });
      
      // Simulate proof generation
      const proofMessage = {
        type: "proof",
        proof: {
          user: { handle: "testuser" },
          likes: [{ id: "123", text: "test tweet" }],
          totalLikes: 1
        }
      };
      browser.runtime.onMessage._listeners?.forEach((listener: any) => {
        listener(proofMessage);
      });
    }
  });
  
  // Wait for proof generation confirmation
  await page.waitForTimeout(2000);
  
  // Verify proof generation success message
  const proofSuccess = page.getByText('Proof generated successfully!');
  await expect(proofSuccess).toBeVisible({ timeout: 10000 });
}

export async function submitTaskForReview(page: Page): Promise<void> {
  // Find and click submit button (should be enabled after proof generation)
  const submitButton = page.locator('button:has-text("Submit for Review")');
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  
  // Should show submitting state briefly
  const submittingButton = page.locator('button:has-text("Submitting...")');
  await expect(submittingButton).toBeVisible({ timeout: 5000 });
}

export async function verifyTaskSubmitted(page: Page): Promise<void> {
  // Should navigate back to main panel automatically
  const userProfile = page.locator('[data-testid="user-profile"]');
  await expect(userProfile).toBeVisible({ timeout: 15000 });
  
  // Active task status should be updated (no longer showing Submit button)
  const activeTaskSection = page.locator('h2:has-text("Active Task")');
  await expect(activeTaskSection).toBeVisible({ timeout: 10000 });
  
  // Submit Task button should no longer be visible
  const submitTaskButton = page.locator('button:has-text("Submit Task")');
  await expect(submitTaskButton).not.toBeVisible({ timeout: 5000 });
}

export async function verifySubmissionError(page: Page, errorMessage: string): Promise<void> {
  // Should show error message
  const errorAlert = page.locator('[class*="bg-red-50"]', { hasText: errorMessage });
  await expect(errorAlert).toBeVisible({ timeout: 10000 });
}

export async function navigateBackFromSubmission(page: Page): Promise<void> {
  // Click back button from submission page
  const backButton = page.locator('button:has-text("← Back")');
  await expect(backButton).toBeVisible();
  await backButton.click();
  
  // Should return to main panel
  const userProfile = page.locator('[data-testid="user-profile"]');
  await expect(userProfile).toBeVisible({ timeout: 5000 });
}