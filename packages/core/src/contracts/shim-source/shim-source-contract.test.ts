import { shimSourceContract } from './shim-source-contract';
import { ShimSourceStub } from './shim-source.stub';

describe('shimSourceContract', () => {
  describe('valid shim sources', () => {
    it('VALID: {stub default} => parses the generated source', () => {
      expect(shimSourceContract.parse(ShimSourceStub())).toBe("const caseSet = require('./x.cases.json');");
    });
  });

  describe('invalid shim sources', () => {
    it('EMPTY: {empty string} => throws, since an empty shim would silently run nothing', () => {
      expect(() => {
        return shimSourceContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});
