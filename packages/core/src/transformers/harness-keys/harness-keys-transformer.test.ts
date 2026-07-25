import { HarnessDeclarationStub } from '../../contracts/harness-declaration/harness-declaration.stub';
import { harnessKeysTransformer } from './harness-keys-transformer';

describe('harnessKeysTransformer', () => {
  describe('projecting the key inventory', () => {
    it('VALID: {one declaration} => returns its (entry, param) pair', () => {
      const result = harnessKeysTransformer({ declarations: [HarnessDeclarationStub()] });

      expect(result).toStrictEqual([{ entry: 'audit', param: 'report' }]);
    });

    it('VALID: {keys authored out of order} => sorts by entry then parameter', () => {
      const result = harnessKeysTransformer({
        declarations: [
          HarnessDeclarationStub({
            inputs: { collect: { sink: 1, drain: 2 }, audit: { report: 3 } },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { entry: 'audit', param: 'report' },
        { entry: 'collect', param: 'drain' },
        { entry: 'collect', param: 'sink' },
      ]);
    });

    it('VALID: {two assayerHarness calls} => folds both into one inventory', () => {
      const result = harnessKeysTransformer({
        declarations: [
          HarnessDeclarationStub({ inputs: { audit: { report: 1 } } }),
          HarnessDeclarationStub({ inputs: { collect: { sink: 2 } } }),
        ],
      });

      expect(result).toStrictEqual([
        { entry: 'audit', param: 'report' },
        { entry: 'collect', param: 'sink' },
      ]);
    });

    it('EDGE: {the same pair declared twice} => records it once', () => {
      const result = harnessKeysTransformer({
        declarations: [
          HarnessDeclarationStub({ inputs: { audit: { report: 1 } } }),
          HarnessDeclarationStub({ inputs: { audit: { report: 2 } } }),
        ],
      });

      expect(result).toStrictEqual([{ entry: 'audit', param: 'report' }]);
    });

    it('EMPTY: {an entry with no parameters} => contributes no keys', () => {
      const result = harnessKeysTransformer({ declarations: [HarnessDeclarationStub({ inputs: { audit: {} } })] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no declarations} => returns no keys', () => {
      const result = harnessKeysTransformer({ declarations: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
