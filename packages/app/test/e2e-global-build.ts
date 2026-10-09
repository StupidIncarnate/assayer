import { runBuild } from '#gateway/bin/npm';
import { resolve } from '#gateway/node/path';

import { compileSmokeCache } from './harnesses/smoke-cache.harness';

/**
 * Playwright globalSetup — rebuild the whole repo, then compile the manual-smoke-repo ONCE, before any spec.
 *
 * WHY BUILD: the e2e boots the real built Electron app (packages/app/dist), and app's Vite bundle
 * inlines the @assayer/shared contracts. Ward's e2e stage runs `playwright test` with no build step of
 * its own. The root `npm run build` builds every package once in dependency order, app's Vite bundle
 * included, and then copies each dist/package.json. Without it, a changed shared contract leaves a
 * stale bundle. That bundle's client-side Zod validation rejects freshly shaped cache blobs, and the
 * file view fails to render with no error. Running the build here makes it an enforced step instead
 * of a documented prerequisite.
 *
 * WHY COMPILE ONCE: the manual-smoke-repo compile is deterministic, so every spec reads the same bytes. Building
 * the shared cache here — instead of a fresh ~10s CLI compile per test — lets the smoke specs share one
 * warm Electron process (see e2e-fixtures), collapsing the suite's fixed setup from minutes to seconds.
 */
const setupE2e = async (): Promise<void> => {
  const { exitCode, output } = await runBuild({ cwd: resolve(__dirname, '..', '..', '..') });
  if (exitCode !== 0) {
    throw new Error(`assayer: \`npm run build\` exited ${exitCode}, so the e2e suite has no built app to launch. Build output:\n${output}`);
  }
  await compileSmokeCache();
};

export default setupE2e;
