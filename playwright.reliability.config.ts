import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/reliability-public.spec.ts",
  workers: 1,
  timeout: 60000,
  use: { baseURL: "http://localhost:5175", channel: "chrome", headless: true },
  reporter: "line",
});
