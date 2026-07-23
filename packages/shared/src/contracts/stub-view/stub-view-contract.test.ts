import { stubViewContract } from './stub-view-contract';
import { StubViewStub } from './stub-view.stub';

describe('stubViewContract', () => {
  describe('valid stub views', () => {
    it('VALID: {stub default} => carries its object stubs and empty env stubs', () => {
      const result = stubViewContract.parse(StubViewStub());

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

  describe('invalid stub views', () => {
    it('INVALID: {objectStubs not an array} => throws validation error', () => {
      expect(() => {
        return stubViewContract.parse({ objectStubs: 'nope', envStubs: [] });
      }).toThrow(/Expected array/u);
    });
  });
});
