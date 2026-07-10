import { preloadBridgeStatics } from './preload-bridge-statics';

describe('preloadBridgeStatics', () => {
  describe('unavailableMessage', () => {
    it('VALID: unavailableMessage => the actionable preload-unavailable diagnostic', () => {
      expect(preloadBridgeStatics.unavailableMessage).toBe(
        'Assayer preload bridge unavailable: window.assayerBridge was not exposed by the Electron ' +
          'preload. The preload never ran contextBridge.exposeInMainWorld — verify the BrowserWindow ' +
          'sets webPreferences.sandbox=false (or the preload is bundled to a single file) and that the ' +
          'preload path resolves to a built .js.',
      );
    });
  });
});
