/**
 * PURPOSE: Playwright e2e entrypoint for the Assayer desktop app. Re-exports test/expect so specs
 *   never import @playwright/test directly, and exposes wireHarnessLifecycle to auto-wire a
 *   harness's afterEach cleanup (the sanctioned way specs get teardown without writing hooks).
 *
 * USAGE:
 * import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
 * const app = electronAppHarness();
 * wireHarnessLifecycle({ harness: app });
 */
import { test, expect } from '@playwright/test';

export interface HarnessLifecycle {
  afterEach?: () => Promise<void> | void;
}

export const wireHarnessLifecycle = ({ harness }: { harness: HarnessLifecycle }): void => {
  test.afterEach(async () => {
    await harness.afterEach?.();
  });
};

export { test, expect };
