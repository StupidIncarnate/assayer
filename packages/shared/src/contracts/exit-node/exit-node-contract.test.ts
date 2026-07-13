import { exitNodeContract } from './exit-node-contract';
import { ExitNodeStub } from './exit-node.stub';

describe('exitNodeContract', () => {
  describe('valid exit nodes', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const node = ExitNodeStub();

      const result = exitNodeContract.parse(node);

      expect(result).toStrictEqual(node);
    });

    it('VALID: {kind: "implicit", guardPath: []} => parses an unguarded implicit exit', () => {
      const node = ExitNodeStub({ coverageId: 'run/exit@implicit', kind: 'implicit', guardPath: [], line: 5 });

      const result = exitNodeContract.parse(node);

      expect(result).toStrictEqual(node);
    });
  });

  describe('invalid exit nodes', () => {
    it('INVALID: {kind: "goto"} => throws validation error', () => {
      expect(() => {
        return exitNodeContract.parse({
          coverageId: 'formatGreeting/return@if-then',
          kind: 'goto',
          guardPath: [],
          line: 3,
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
