import { test, expect } from "./fixtures";
import { openSidePanel } from "./pages/sidepanel";

/**
 * E2E Test: Instagram Account Addition Success Case
 * 
 * This test validates the complete flow of adding an Instagram account
 * through the Chrome extension, including:
 * - Extension loading
 * - Side panel opening
 * - Account form interaction
 * - Verification process completion
 */

test.describe('Instagram Account Addition', () => {
  test('should successfully add Instagram account', async ({ page, extensionId }) => {
    const sidePanel = await openSidePanel(page, extensionId);
    const username = 'instagram';

    // Wait for the side panel to load and show Instagram section with Plus button
    await sidePanel.getAddAccountButton('Instagram').waitFor({ timeout: 10000 });

    // Click the Plus button for Instagram
    await sidePanel.clickAddAccount('Instagram');

    // Wait for the input form to appear
    await sidePanel.getUsernameInput().waitFor({ timeout: 5000 });

    // Enter a test Instagram username (using a known working account)
    await sidePanel.enterUsername(username);

    // Submit the form (press Enter)
    await sidePanel.submitForm();

    // Wait for the account to appear in the list
    await sidePanel.waitForAccountToAppear(username);

    // Wait for verification to start
    await sidePanel.waitForVerificationStart(username);

    // Check that the account shows as "Verifying..."
    expect(await sidePanel.isAccountVerifying(username)).toBe(true);

    // Wait for verification to complete (this might take a while)
    await sidePanel.waitForVerificationComplete(username);

    // Verify the account was verified successfully
    expect(await sidePanel.isAccountVerified(username)).toBe(true);

    // Verify the account item is clickable (not disabled)
    const accountItem = sidePanel.getAccountItem(username);
    await expect(accountItem).toBeVisible();
    await expect(accountItem).not.toBeDisabled();

    console.log('✅ Instagram account successfully added and verified');
  });

  test('should handle username with dots (ma3ak.health)', async ({ page, extensionId }) => {
    const sidePanel = await openSidePanel(page, extensionId);
    const username = 'ma3ak.health';

    // Navigate to add account form
    await sidePanel.getAddAccountButton('Instagram').waitFor();
    await sidePanel.clickAddAccount('Instagram');

    // Enter the dotted username that was problematic
    await sidePanel.getUsernameInput().waitFor();
    await sidePanel.enterUsername(username);
    await sidePanel.submitForm();

    // Wait for the account to appear and verification to start
    await sidePanel.waitForAccountToAppear(username);
    await sidePanel.waitForVerificationStart(username);

    // For this test, we just want to verify that:
    // 1. The username is accepted (no validation error)
    // 2. The verification process starts
    expect(await sidePanel.isAccountVerifying(username)).toBe(true);

    // We don't need to wait for full verification since ma3ak.health might be a real account
    // and we don't want to spam their profile. The key test is that dotted usernames are now accepted.

    console.log('✅ Dotted username (ma3ak.health) accepted and verification started');
  });

  test('should handle shorter invalid username', async ({ page, extensionId }) => {
    const sidePanel = await openSidePanel(page, extensionId);
    const username = 'nonexistent123'; // Shorter invalid username

    // Navigate to add account form
    await sidePanel.getAddAccountButton('Instagram').waitFor();
    await sidePanel.clickAddAccount('Instagram');

    // Enter an invalid username that should not exist
    await sidePanel.getUsernameInput().waitFor();
    await sidePanel.enterUsername(username);
    await sidePanel.submitForm();

    // Wait for the account to appear and verification to start
    await sidePanel.waitForAccountToAppear(username);
    await sidePanel.waitForVerificationStart(username);

    // Verification should start (even for invalid usernames)
    expect(await sidePanel.isAccountVerifying(username)).toBe(true);

    // The test passes if we can successfully initiate verification
    // The actual verification failure/success is handled by the background service
    // and depends on Instagram's response, which we don't want to rely on in E2E tests

    console.log('✅ Invalid username accepted for verification (service will handle the actual validation)');
  });
});