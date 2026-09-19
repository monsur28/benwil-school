import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  // The real Neon Postgres database (remote, not local) plus Next dev-mode
  // route compilation means individual assertions can take noticeably
  // longer than Playwright's 5s default under a full-suite run, even
  // though nothing is actually wrong - raise the defaults rather than
  // patch timeouts on every assertion.
  timeout: 180_000,
  expect: {
    timeout: 30_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
