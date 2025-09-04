import { Page, expect } from '@playwright/test';

export async function loginWithCredentials(page: Page, email: string, otp: string): Promise<void> {
  // Click login button
  const loginButton = page.locator('[data-testid="login-button"]');
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await loginButton.click();
  
  // Fill email
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(email);
  await page.waitForTimeout(1000);
  
  // Submit email
  const submitButton = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Send code"), button:has-text("Submit")').first();
  await expect(submitButton).toBeVisible();
  await submitButton.click();
  
  // Fill OTP
  const otpInput = page.locator('input[type="text"], input[inputmode="numeric"]').first();
  await expect(otpInput).toBeVisible({ timeout: 10000 });
  await otpInput.fill(otp);
}

export async function verifyLoginSuccess(page: Page, expectedEmail: string): Promise<void> {
  // Wait for user profile to appear
  const userProfile = page.locator('[data-testid="user-profile"]');
  await expect(userProfile).toBeVisible({ timeout: 30000 });
  
  // Verify the email appears in the user profile
  await expect(userProfile).toContainText(expectedEmail);
}