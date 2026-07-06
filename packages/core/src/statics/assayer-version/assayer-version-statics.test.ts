import { assayerVersionStatics } from './assayer-version-statics';

describe('assayerVersionStatics', () => {
  describe('release', () => {
    it('VALID: release.version => is the current assayer version', () => {
      expect(assayerVersionStatics.release.version).toBe('1.0.0');
    });
  });
});
