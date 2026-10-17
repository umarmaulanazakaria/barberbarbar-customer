import dasar from "./playwright.customer-principal.config";
import { defineConfig } from "@playwright/test";
export default defineConfig({ ...dasar, testMatch: "**/detail-ux.spec.ts", timeout: 90000 });
