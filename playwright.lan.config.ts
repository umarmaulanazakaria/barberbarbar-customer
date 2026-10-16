import { defineConfig } from "@playwright/test";
const asal = (globalThis as typeof globalThis & {process?: {env: Record<string,string|undefined>}}).process?.env.LAN_TEST_ORIGIN;
if (!asal) throw new Error("Isi LAN_TEST_ORIGIN dengan URL HTTP LAN Customer Web yang aktif.");
export default defineConfig({
  testDir: "./tests", testMatch: "**/compatibility-lan.spec.ts", workers: 1, timeout: 45000,
  use: {baseURL: asal, channel: "chrome", headless: true, viewport: {width:390,height:844}},
});
