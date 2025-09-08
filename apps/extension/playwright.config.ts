import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'http://localhost:3000',
    
    // Extension-specific settings
    headless: false, // Extensions require headed mode
    viewport: { width: 400, height: 600 }, // Side panel dimensions
    
    // Custom context options for extension testing
    contextOptions: {
      // Load the extension from the build output
      args: [
        `--disable-extensions-except=${path.join(__dirname, '.output/chrome-mv3')}`,
        `--load-extension=${path.join(__dirname, '.output/chrome-mv3')}`
      ],
      permissions: ['clipboard-read', 'clipboard-write'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chromium'
      },
    },
    {
      name: 'chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});