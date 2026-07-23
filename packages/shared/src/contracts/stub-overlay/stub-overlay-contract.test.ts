import { stubOverlayContract } from './stub-overlay-contract';
import { StubOverlayStub } from './stub-overlay.stub';

describe('stubOverlayContract', () => {
  describe('object overlay', () => {
    it('VALID: {stub default} => an object correction carrying its key, overlay path, and per-property values', () => {
      const result = stubOverlayContract.parse(StubOverlayStub());

      expect(result).toStrictEqual({
        kind: 'object',
        key: 'src/config/config.ts#Config',
        overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
        properties: [{ name: 'mode', values: ['dev', 'prod', 'staging'] }],
      });
    });
  });

  describe('env overlay', () => {
    it('VALID: {kind env} => an env correction carrying its key, overlay path, property, and values', () => {
      const result = stubOverlayContract.parse({
        kind: 'env',
        key: 'process.env#CODE',
        overlayPath: 'assayer/stubs/env/CODE.json',
        property: 'CODE',
        values: ['1', '2', 'other'],
      });

      expect(result).toStrictEqual({
        kind: 'env',
        key: 'process.env#CODE',
        overlayPath: 'assayer/stubs/env/CODE.json',
        property: 'CODE',
        values: ['1', '2', 'other'],
      });
    });
  });

  describe('invalid overlay', () => {
    it('INVALID: {unknown kind} => throws validation error', () => {
      expect(() => {
        return stubOverlayContract.parse({
          kind: 'array',
          key: 'src/config/config.ts#Config',
          overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
        });
      }).toThrow(/Invalid discriminator value/u);
    });
  });
});
