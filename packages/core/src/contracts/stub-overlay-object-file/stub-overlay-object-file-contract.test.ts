import { stubOverlayObjectFileContract } from './stub-overlay-object-file-contract';
import { StubOverlayObjectFileStub } from './stub-overlay-object-file.stub';

describe('stubOverlayObjectFileContract', () => {
  describe('valid object overlay files', () => {
    it('VALID: {stub default} => carries the type identity and per-property values', () => {
      const result = stubOverlayObjectFileContract.parse(StubOverlayObjectFileStub());

      expect(result).toStrictEqual({
        type: 'src/config/config.ts#Config',
        properties: { mode: { values: ['dev', 'prod', 'staging'] } },
      });
    });
  });

  describe('invalid object overlay files', () => {
    it('INVALID: {no type} => throws validation error', () => {
      expect(() => {
        return stubOverlayObjectFileContract.parse({ properties: {} });
      }).toThrow(/Required/u);
    });
  });
});
