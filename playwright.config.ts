import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  testIgnore: ["**/guest-live.spec.ts", "**/tracking-live.spec.ts", "**/reliability-public.spec.ts", "**/customer-principal.spec.ts", "**/realtime-live.spec.ts", "**/compatibility-lan.spec.ts", "**/mobile-ux.spec.ts", "**/payment-ux.spec.ts", "**/detail-ux.spec.ts"],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: "http://127.0.0.1:5185",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --mode test --port 5185",
    url: "http://127.0.0.1:5185",
    reuseExistingServer: false,
    timeout: 30_000,
    env: { VITE_API_BASE_URL: "/api", VITE_GUEST_BOOKING_ENABLED: "false" },
  },
});
