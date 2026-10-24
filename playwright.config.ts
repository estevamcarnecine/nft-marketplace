import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
// PLAYWRIGHT_BASE_URL runs the suite against a deployed copy (e.g. the Vercel URL) instead of a local build.
const EXTERNAL_URL = process.env.PLAYWRIGHT_BASE_URL
const BASE_URL = EXTERNAL_URL ?? `http://localhost:${PORT}`

/**
 * E2E against the production build (`vite preview`) with the MSW mocks it ships with. Every test
 * gets a fresh browser context, so storage and the in-page mock database start from the fixtures.
 */
export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.002 },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  // Baselines are versioned per platform: text rasterization differs between operating systems.
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      // Main flows and the visual baselines; tagged in the specs.
      grep: /@main|@visual/,
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: EXTERNAL_URL
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
})
