import { walkContextContract } from './walk-context-contract';
import { WalkContextStub } from './walk-context.stub';

describe('walkContextContract', () => {
  describe('valid walk contexts', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const context = WalkContextStub();

      const result = walkContextContract.parse(context);

      expect(result).toStrictEqual(context);
    });

    it('VALID: {nested scopePath, guarded} => parses a context inside a class method arm', () => {
      const context = WalkContextStub({
        scopePath: ['Classifier', 'classify'],
        guardPath: [{ branchCoverageId: 'Classifier/classify/if:id:value', arm: 'then' }],
      });

      const result = walkContextContract.parse(context);

      expect(result).toStrictEqual(context);
    });

    it('EMPTY: {scopePath: [], params: []} => parses the seed context of a walk', () => {
      const context = WalkContextStub({ scopePath: [], params: [], exported: false });

      const result = walkContextContract.parse(context);

      expect(result).toStrictEqual(context);
    });
  });

  describe('invalid walk contexts', () => {
    it('EMPTY: {guardPath: [{arm: ""}]} => throws validation error', () => {
      expect(() => {
        return walkContextContract.parse({
          scopePath: ['classify'],
          guardPath: [{ branchCoverageId: 'classify/if:id:value', arm: '' }],
          params: [],
          exported: true,
        });
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {exported: "yes"} => throws validation error', () => {
      expect(() => {
        return walkContextContract.parse({ scopePath: [], guardPath: [], params: [], exported: 'yes' });
      }).toThrow(/Expected boolean/u);
    });
  });
});
