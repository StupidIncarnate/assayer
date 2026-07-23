import { stubOverlayEnvFileContract } from './stub-overlay-env-file-contract';
import { StubOverlayEnvFileStub } from './stub-overlay-env-file.stub';

describe('stubOverlayEnvFileContract', () => {
  describe('valid env overlay files', () => {
    it('VALID: {stub default} => carries the source, property, and values', () => {
      const result = stubOverlayEnvFileContract.parse(StubOverlayEnvFileStub());

      expect(result).toStrictEqual({ source: 'process.env', property: 'CODE', values: ['1', '2', 'other'] });
    });
  });

  describe('invalid env overlay files', () => {
    it('INVALID: {source not process.env} => throws validation error', () => {
      expect(() => {
        return stubOverlayEnvFileContract.parse({ source: 'os.environ', property: 'CODE', values: [] });
      }).toThrow(/Invalid literal value/u);
    });
  });
});
