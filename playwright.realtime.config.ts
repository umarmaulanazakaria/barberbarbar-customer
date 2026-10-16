import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "**/realtime-live.spec.ts", workers: 1, timeout: 90_000,
  use: { baseURL: "http://127.0.0.1:5186", channel: "chrome", headless: true },
  reporter: "line",
});
