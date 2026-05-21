import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:4200";
const apiURL = process.env["PLAYWRIGHT_API_URL"] ?? "http://localhost:3001/api/v1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
  },
  webServer:
    process.env["CI"] || process.env["PLAYWRIGHT_SKIP_WEBSERVER"]
      ? undefined
      : {
          command: "pnpm run start",
          url: baseURL,
          reuseExistingServer: true,
          timeout: 180_000,
        },
});
