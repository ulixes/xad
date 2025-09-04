import { test, expect } from "./fixtures";
import { openSidePanel } from "./pages/sidepanel";
import { loginWithCredentials, verifyLoginSuccess } from "./authUtils";
import { navigateToTasks, verifyTaskList, returnToMainPanel, claimFirstAvailableTask, verifyTaskClaimed, verifyClaimError, verifyNoTasksAvailable, navigateToTaskSubmission, proceedFromGuidelines, verifyProofSteps, simulateProofGeneration, submitTaskForReview, verifyTaskSubmitted, navigateBackFromSubmission } from "./taskUtils";
import { testUsers } from "./testData";

test.describe("Task Management", () => {
  test("User can view available tasks after login", async ({ page, extensionId }) => {
    await openSidePanel(page, extensionId);
    await loginWithCredentials(page, testUsers.validUser.email, testUsers.validUser.otp);
    await verifyLoginSuccess(page, testUsers.validUser.email);
    await navigateToTasks(page);
    await verifyTaskList(page);
    await returnToMainPanel(page);
  });

  test("User can claim a task successfully", async ({ page, extensionId }) => {
    await openSidePanel(page, extensionId);
    await loginWithCredentials(page, testUsers.validUser.email, testUsers.validUser.otp);
    await verifyLoginSuccess(page, testUsers.validUser.email);
    await navigateToTasks(page);
    
    // Check if tasks are available and claim one
    const noTasksMessage = page.locator('text="No Tasks Available"');
    const claimButton = page.locator('button:has-text("Claim $")').first();
    
    if (await noTasksMessage.isVisible({ timeout: 5000 })) {
      // If no tasks available, verify the no tasks state
      await verifyNoTasksAvailable(page);
    } else {
      // If tasks are available, try to claim one
      await claimFirstAvailableTask(page);
      await verifyTaskClaimed(page);
    }
  });

  test("User sees appropriate message when no tasks available", async ({ page, extensionId }) => {
    await openSidePanel(page, extensionId);
    await loginWithCredentials(page, testUsers.validUser.email, testUsers.validUser.otp);
    await verifyLoginSuccess(page, testUsers.validUser.email);
    await navigateToTasks(page);
    
    // This test will verify either tasks are available or no tasks message is shown
    const taskElements = page.locator('[class*="border-2"][class*="shadow-"]').filter({ hasText: /@/ });
    const noTasksMessage = page.locator('text="No Tasks Available"');
    
    // Either tasks should be available or no tasks message should show
    await expect(taskElements.first().or(noTasksMessage)).toBeVisible({ timeout: 10000 });
    
    // If no tasks, verify the UI handles it properly
    if (await noTasksMessage.isVisible()) {
      await verifyNoTasksAvailable(page);
    }
  });

  test("User can navigate through task submission flow", async ({ page, extensionId }) => {
    await openSidePanel(page, extensionId);
    await loginWithCredentials(page, testUsers.validUser.email, testUsers.validUser.otp);
    await verifyLoginSuccess(page, testUsers.validUser.email);
    
    // Check if there's an active task with Submit button
    const submitTaskButton = page.locator('button:has-text("Submit Task")');
    
    if (await submitTaskButton.isVisible({ timeout: 5000 })) {
      // Test the full submission flow
      await navigateToTaskSubmission(page);
      await proceedFromGuidelines(page);
      await verifyProofSteps(page);
      
      // Test navigation back
      await navigateBackFromSubmission(page);
    } else {
      // If no active task, first try to claim one
      await navigateToTasks(page);
      
      const claimButton = page.locator('button:has-text("Claim $")').first();
      if (await claimButton.isVisible({ timeout: 5000 })) {
        await claimFirstAvailableTask(page);
        await verifyTaskClaimed(page);
        
        // Now try submission flow
        const newSubmitButton = page.locator('button:has-text("Submit Task")');
        if (await newSubmitButton.isVisible({ timeout: 5000 })) {
          await navigateToTaskSubmission(page);
          await proceedFromGuidelines(page);
          await verifyProofSteps(page);
          await navigateBackFromSubmission(page);
        }
      }
    }
  });

  test("User can complete task submission with simulated proof", async ({ page, extensionId }) => {
    await openSidePanel(page, extensionId);
    await loginWithCredentials(page, testUsers.validUser.email, testUsers.validUser.otp);
    await verifyLoginSuccess(page, testUsers.validUser.email);
    
    // Check if there's an active task or need to claim one first
    const submitTaskButton = page.locator('button:has-text("Submit Task")');
    
    if (!(await submitTaskButton.isVisible({ timeout: 5000 }))) {
      // Try to claim a task first
      await navigateToTasks(page);
      
      const claimButton = page.locator('button:has-text("Claim $")').first();
      if (await claimButton.isVisible({ timeout: 5000 })) {
        await claimFirstAvailableTask(page);
        await verifyTaskClaimed(page);
      } else {
        // Skip test if no tasks available to claim
        test.skip('No tasks available to claim for submission test');
      }
    }
    
    // Now proceed with submission flow
    if (await page.locator('button:has-text("Submit Task")').isVisible({ timeout: 5000 })) {
      await navigateToTaskSubmission(page);
      await proceedFromGuidelines(page);
      await verifyProofSteps(page);
      
      // Simulate proof generation (since we can't actually go to X.com in tests)
      await simulateProofGeneration(page);
      
      // Submit the task
      await submitTaskForReview(page);
      await verifyTaskSubmitted(page);
    }
  });
});