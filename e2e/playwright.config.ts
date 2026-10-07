import { fileURLToPath } from 'node:url'

import { defineConfig, devices } from '@playwright/test'

const inCI = process.env['CI'] === 'true'

export default defineConfig({
  testDir: '.',
  outputDir: '../test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: inCI ? 2 : 0,
  failOnFlakyTests: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    command: 'pnpm build && pnpm preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
