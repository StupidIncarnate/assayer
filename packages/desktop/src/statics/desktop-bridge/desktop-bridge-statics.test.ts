import { desktopBridgeStatics } from './desktop-bridge-statics';

describe('desktopBridgeStatics', () => {
  describe('bridge + channels', () => {
    it('VALID: bridge.key => is assayerBridge', () => {
      expect(desktopBridgeStatics.bridge.key).toBe('assayerBridge');
    });

    it('VALID: channels.status => is assayer:status', () => {
      expect(desktopBridgeStatics.channels.status).toBe('assayer:status');
    });
  });
});
