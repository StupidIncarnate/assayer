import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { electronAppHarness } from '../../../test/harnesses/electron-app.harness';

test.describe('Assayer status handshake', () => {
  const app = electronAppHarness();
  wireHarnessLifecycle({ harness: app });

  test('VALID: {app boots} => renders the status panel from the preload bridge', async () => {
    const appWindow = await app.launch();

    // STATUS_PANEL only mounts when the preload exposed window.assayerBridge AND getStatus() resolved
    // over IPC — the exact seam that broke when the preload ran sandboxed.
    await expect(appWindow.getByTestId('STATUS_PANEL')).toBeVisible({ timeout: 30_000 });
    await expect(appWindow.getByTestId('STATUS_MESSAGE')).toHaveText('Assayer core online');

    // The red bridge-unavailable alert must NOT be present.
    await expect(appWindow.getByTestId('STATUS_ERROR')).toHaveCount(0);
  });
});
