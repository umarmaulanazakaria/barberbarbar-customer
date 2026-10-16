import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/customer-principal.spec.ts",
  workers: 1,
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:5190", channel: "chrome", headless: true },
  webServer: {
    command: "npm run dev -- --port 5190",
    url: "http://127.0.0.1:5190",
    reuseExistingServer: false,
    env: { VITE_API_BASE_URL: "/api", VITE_GUEST_BOOKING_ENABLED: "true" },
  },
});
