import { defineConfig } from '@playwright/test'

// Suite E2E de la Fase 2 (HU-F2-T1). Corre contra el stack de Docker
// (frontend en 5173 con proxy /api → backend 8080). Si el stack no está
// corriendo, los tests fallan al navegar — arráncalo con docker compose up -d.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    locale: 'es-PE',
    viewport: { width: 1280, height: 860 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    acceptDownloads: true,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
