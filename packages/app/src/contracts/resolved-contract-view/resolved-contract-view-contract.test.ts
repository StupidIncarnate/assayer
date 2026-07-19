import { resolvedContractViewContract } from './resolved-contract-view-contract';
import { ResolvedContractViewStub } from './resolved-contract-view.stub';

describe('resolvedContractViewContract', () => {
  describe('valid inspector entries', () => {
    it('VALID: {stub default} => a package entry with one input and a return', () => {
      const result = resolvedContractViewContract.parse(ResolvedContractViewStub());

      expect(result).toStrictEqual({
        symbol: 'greet',
        source: 'pkg vendored-pkg',
        inputs: ['name: string'],
        output: 'returns string',
      });
    });

    it('VALID: {no inputs and no output} => a bare entry the widget shows with a — input', () => {
      const result = resolvedContractViewContract.parse({
        symbol: "import './side-effect'",
        source: "import './side-effect' → src/side-effect.ts",
        inputs: [],
      });

      expect(result).toStrictEqual({
        symbol: "import './side-effect'",
        source: "import './side-effect' → src/side-effect.ts",
        inputs: [],
      });
    });
  });

  describe('invalid inspector entries', () => {
    it('EMPTY: {blank symbol} => throws rather than an empty inspector cell', () => {
      expect(() =>
        resolvedContractViewContract.parse({ symbol: '', source: 'global', inputs: [] }),
      ).toThrow(/at least 1/iu);
    });
  });
});
