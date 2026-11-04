import { defineConfig } from '@playwright/test';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 1080 },
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    screenshot: 'only-on-failure',
  },
  reporter: 'list',
  webServer: { command: 'pnpm dev', url: baseURL, reuseExistingServer: true, timeout: 60000 },
});
