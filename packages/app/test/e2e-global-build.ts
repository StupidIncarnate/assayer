import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Playwright globalSetup — rebuild the whole repo before any e2e spec runs.
 *
 * WHY: the e2e boots the REAL built Electron app (packages/app/dist) with @assayer/shared contracts
 * INLINED into its vite bundle. ward's e2e stage shells straight into `playwright test` with NO build
 * hook, and the app is NOT in the tsc build graph (tsconfig.build.json) — so `tsc --build` alone never
 * refreshes the vite bundle. Without this, a changed shared contract leaves a STALE bundle whose
 * client-side Zod validation rejects freshly-shaped cache blobs, and the file view silently fails to
 * render. Running the root `npm run build` here (tsc dist + the app's vite bundle + dist/package.json
 * copies) turns the "must run build first" prerequisite from documentation into an enforced step.
 */
const rebuildForE2e = (): void => {
  execSync('npm run build', { cwd: resolve(__dirname, '..', '..', '..'), stdio: 'inherit' });
};

export default rebuildForE2e;
