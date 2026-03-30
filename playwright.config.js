import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:5173/spotify-frutiger-aero/',
    headless: true,
  },
})