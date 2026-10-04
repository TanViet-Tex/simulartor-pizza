import { defineConfig } from '@playwright/test';

const viewports = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'only-on-failure' },
  projects: (['chromium', 'webkit'] as const).flatMap((browserName) =>
    viewports.map((viewport) => ({
      name: `${browserName}-${viewport.width}x${viewport.height}`,
      use: { browserName, viewport, isMobile: true, hasTouch: true },
    })),
  ),
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
