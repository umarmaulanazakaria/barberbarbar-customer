import {defineConfig} from '@playwright/test';
const asal=(globalThis as typeof globalThis & {process?:{env:Record<string,string|undefined>}}).process?.env.TRACKING_TEST_ORIGIN??'http://localhost:5175';
export default defineConfig({testDir:'./tests',testMatch:'**/tracking-live.spec.ts',workers:1,timeout:60000,use:{baseURL:asal,channel:'chrome',headless:true},reporter:'line'});
