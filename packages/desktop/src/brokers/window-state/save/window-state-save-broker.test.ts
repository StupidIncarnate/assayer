import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { WindowStateStub } from '../../../contracts/window-state/window-state.stub';
import { windowStateSaveBroker } from './window-state-save-broker';
import { windowStateSaveBrokerProxy } from './window-state-save-broker.proxy';

describe('windowStateSaveBroker', () => {
  const repoPath = '/repo';

  describe('saving window state', () => {
    it('VALID: {repoPath, state} => writes formatted JSON to .assayer/window-state.json', async () => {
      const proxy = windowStateSaveBrokerProxy();
      proxy.setupSaveSucceeds({ repoPath });
      const state = WindowStateStub({
        width: 1400,
        height: 900,
        x: 50,
        y: 50,
        isMaximized: true,
        isFullScreen: false,
      });

      await windowStateSaveBroker({ repoPath, state });

      expect(proxy.savedContents({ repoPath })).toBe(
        `${JSON.stringify(state, null, 2)}\n`,
      );
    });
  });

  describe('error handling', () => {
    it('ERROR: {writing fails} => propagates the write error', async () => {
      const proxy = windowStateSaveBrokerProxy();
      proxy.setupWriteFails({
        repoPath,
        error: FsErrorStub({ code: 'EACCES', path: '/repo/.assayer/window-state.json' }),
      });
      const state = WindowStateStub();

      await expect(windowStateSaveBroker({ repoPath, state })).rejects.toThrow(
        /EACCES/u,
      );
    });
  });
});
