import { execSync } from '#gateway/node/child_process';
import { resolve } from '#gateway/node/path';

import { compileSmokeCache } from './harnesses/smoke-cache.harness';

/**
 * Playwright globalSetup — rebuild the whole repo, then compile the smoke-repo ONCE, before any spec.
 *
 * WHY BUILD: the e2e boots the real built Electron app (packages/app/dist), and app's Vite bundle
 * inlines the @assayer/shared contracts. Ward's e2e stage runs `playwright test` with no build step of
 * its own. The root `npm run build` builds every package once in dependency order, app's Vite bundle
 * included, and then copies each dist/package.json. Without it, a changed shared contract leaves a
 * stale bundle. That bundle's client-side Zod validation rejects freshly shaped cache blobs, and the
 * file view fails to render with no error. Running the build here makes it an enforced step instead
 * of a documented prerequisite.
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
