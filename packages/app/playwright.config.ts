import { defineConfig } from '@playwright/test';

// Global e2e headless switch: the desktop main reads ASSAYER_HEADLESS and creates its
// BrowserWindow hidden, so no window ever pops up on the developer's display during e2e.
// Set ONCE here (the single e2e config) rather than per-harness — every _electron.launch
// child inherits this runner env. Production launches leave the flag unset and show the window.
process.env.ASSAYER_HEADLESS = '1';

// e2e = Playwright, colocated as *.e2e.ts in the flow folder where the journey starts.
// These boot the REAL built Electron app (dist), so `npm run build` must run first, and a
// display must be available (CI: xvfb). One e2e proves the render/IPC handshake end to end.
export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  // A named project makes Playwright's line reporter emit `[electron] › <file>` — the prefix
  // ward's runner keys on to confirm each discovered e2e actually executed.
  projects: [{ name: 'electron' }],
});
