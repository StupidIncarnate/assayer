import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { compileSmokeCache } from './harnesses/smoke-cache.harness';

/**
 * Playwright globalSetup — rebuild the whole repo, then compile the smoke-repo ONCE, before any spec.
 *
 * WHY BUILD: the e2e boots the REAL built Electron app (packages/app/dist) with @assayer/shared contracts
 * INLINED into its vite bundle. ward's e2e stage shells straight into `playwright test` with NO build
 * hook, and the app is NOT in the tsc build graph (tsconfig.build.json) — so `tsc --build` alone never
 * refreshes the vite bundle. Without this, a changed shared contract leaves a STALE bundle whose
 * client-side Zod validation rejects freshly-shaped cache blobs, and the file view silently fails to
 * render. Running the root `npm run build` here (tsc dist + the app's vite bundle + dist/package.json
 * copies) turns the "must run build first" prerequisite from documentation into an enforced step.
 *
 * WHY COMPILE ONCE: the smoke-repo compile is deterministic, so every spec reads the same bytes. Building
 * the shared cache here — instead of a fresh ~10s CLI compile per test — lets the smoke specs share one
 * warm Electron process (see e2e-fixtures), collapsing the suite's fixed setup from minutes to seconds.
 */
const setupE2e = async (): Promise<void> => {
  execSync('npm run build', { cwd: resolve(__dirname, '..', '..', '..'), stdio: 'inherit' });
  await compileSmokeCache();
};

export default setupE2e;
