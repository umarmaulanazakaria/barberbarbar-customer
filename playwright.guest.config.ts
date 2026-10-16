import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'**/guest-live.spec.ts',workers:1,timeout:30000,
  use:{baseURL:'http://127.0.0.1:5186',channel:'chrome',headless:true},
  webServer:{command:'npm run dev -- --port 5186',url:'http://127.0.0.1:5186',reuseExistingServer:false,
    env:{VITE_API_BASE_URL:'/api',VITE_GUEST_BOOKING_ENABLED:'true',BARBER_API_PROXY_TARGET:'http://127.0.0.1:3185'}}});
