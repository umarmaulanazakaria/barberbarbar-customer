import dasar from "./playwright.customer-principal.config";
import { defineConfig } from "@playwright/test";
export default defineConfig({ ...dasar, testMatch: "**/payment-ux.spec.ts", timeout: 90000 });
