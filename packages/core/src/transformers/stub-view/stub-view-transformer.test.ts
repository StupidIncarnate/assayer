import { StubIndexStub, ObjectStubStub, EnvStubStub, StubOverlayStub } from '@assayer/shared/contracts';

import { stubViewTransformer } from './stub-view-transformer';

describe('stubViewTransformer', () => {
  describe('no overlay', () => {
    it('VALID: {index, no overlays} => the derived stubs pass through unchanged', () => {
      const result = stubViewTransformer({ index: StubIndexStub(), overlays: [] });

      expect(result).toStrictEqual({
        objectStubs: [
          {
            key: 'src/config/config.ts#Config',
            definitionRelPath: 'src/config/config.ts',
            typeName: 'Config',
            properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }],
            readers: ['src/config/config.ts'],
          },
        ],
        envStubs: [],
      });
    });
  });

  describe('an object overlay correcting one of two properties', () => {
    it("VALID: {overlay replaces mode's values, leaves region} => mode demanded from the overlay, region keeps its derived demand", () => {
      const index = StubIndexStub({
        objectStubs: [
          ObjectStubStub({
            properties: [
              { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
              { name: 'region', demand: { kind: 'demanded', values: ['us'] } },
            ],
          }),
        ],
      });
      const overlay = StubOverlayStub({ properties: [{ name: 'mode', values: ['dev', 'prod'] }] });

      const result = stubViewTransformer({ index, overlays: [overlay] });

      expect(result).toStrictEqual({
        objectStubs: [
          {
            key: 'src/config/config.ts#Config',
            definitionRelPath: 'src/config/config.ts',
            typeName: 'Config',
            properties: [
              { name: 'mode', demand: { kind: 'demanded', values: ['dev', 'prod'] } },
              { name: 'region', demand: { kind: 'demanded', values: ['us'] } },
            ],
            readers: ['src/config/config.ts'],
          },
        ],
        envStubs: [],
      });
    });
  });

  describe('an env overlay correcting a guessed property', () => {
    it('VALID: {env overlay replaces the values} => values from the overlay and guessed cleared', () => {
      const index = StubIndexStub({ objectStubs: [], envStubs: [EnvStubStub()] });
      const overlay = StubOverlayStub({
        kind: 'env',
        key: 'process.env#MODE',
        overlayPath: 'assayer/stubs/env/MODE.json',
        property: 'MODE',
        values: ['dev', 'prod'],
      });

      const result = stubViewTransformer({ index, overlays: [overlay] });

      expect(result).toStrictEqual({
        objectStubs: [],
        envStubs: [
          {
            key: 'process.env#MODE',
            property: 'MODE',
            values: ['dev', 'prod'],
            guessed: false,
            readers: ['src/config/config.ts'],
          },
        ],
      });
    });
  });

  describe('an overlay whose key matches no derived stub', () => {
    it('EDGE: {overlay for a gone type} => ignored, the derived stubs pass through unchanged', () => {
      const overlay = StubOverlayStub({
        key: 'src/gone.ts#Gone',
        overlayPath: 'assayer/stubs/objects/src/gone.ts/Gone.json',
      });

      const result = stubViewTransformer({ index: StubIndexStub(), overlays: [overlay] });

      expect(result).toStrictEqual({
        objectStubs: [
          {
            key: 'src/config/config.ts#Config',
            definitionRelPath: 'src/config/config.ts',
            typeName: 'Config',
            properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }],
            readers: ['src/config/config.ts'],
          },
        ],
        envStubs: [],
      });
    });
  });
});
