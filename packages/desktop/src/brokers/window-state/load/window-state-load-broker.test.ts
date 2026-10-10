import { WindowStateStub } from '../../../contracts/window-state/window-state.stub';
import { windowStateLoadBroker } from './window-state-load-broker';
import { windowStateLoadBrokerProxy } from './window-state-load-broker.proxy';

describe('windowStateLoadBroker', () => {
  const repoPath = '/repo';

  describe('persisted state file exists', () => {
    it('VALID: {window-state.json exists} => returns parsed WindowState', async () => {
      const proxy = windowStateLoadBrokerProxy();
      const state = WindowStateStub({
        width: 1400,
        height: 900,
        x: 100,
        y: 100,
        isMaximized: true,
      });

      proxy.setupStateFound({ repoPath, state });

      const result = await windowStateLoadBroker({ repoPath });

      expect(result).toStrictEqual({
        width: 1400,
        height: 900,
        x: 100,
        y: 100,
        isMaximized: true,
      });
    });
  });

  describe('persisted state file is missing or invalid', () => {
    it('EMPTY: {window-state.json missing} => returns default window state', async () => {
      const proxy = windowStateLoadBrokerProxy();
      proxy.setupStateMissing({ repoPath });

      const result = await windowStateLoadBroker({ repoPath });

      expect(result).toStrictEqual({
        width: 1500,
        height: 800,
      });
    });

    it('EMPTY: {window-state.json malformed JSON} => returns default window state', async () => {
      const proxy = windowStateLoadBrokerProxy();
      proxy.setupStateMalformed({ repoPath });

      const result = await windowStateLoadBroker({ repoPath });

      expect(result).toStrictEqual({
        width: 1500,
        height: 800,
      });
    });

    it('EMPTY: {window-state.json invalid schema} => returns default window state', async () => {
      const proxy = windowStateLoadBrokerProxy();
      proxy.setupStateInvalidSchema({ repoPath });

      const result = await windowStateLoadBroker({ repoPath });

      expect(result).toStrictEqual({
        width: 1500,
        height: 800,
      });
    });
  });

  describe('read errors', () => {
    it('ERROR: {reading window-state.json is denied} => throws the read error', async () => {
      const proxy = windowStateLoadBrokerProxy();
      proxy.setupReadDenied({ repoPath });

      await expect(windowStateLoadBroker({ repoPath })).rejects.toThrow(
        /EACCES/u,
      );
    });
  });
});
