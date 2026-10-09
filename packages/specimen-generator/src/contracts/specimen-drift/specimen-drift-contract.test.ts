import { specimenDriftContract } from './specimen-drift-contract';
import { SpecimenDriftStub } from './specimen-drift.stub';

describe('specimenDriftContract', () => {
  describe('valid drift', () => {
    it('VALID: {stub default} => parses a path and the problem "differs"', () => {
      const drift = SpecimenDriftStub();

      const result = specimenDriftContract.parse(drift);

      expect(result).toStrictEqual({
        relPath: 'src/if/function-declaration/a/a.ts',
        problem: 'differs',
      });
    });

    it.each(specimenDriftContract.shape.problem.options)(
      'VALID: {problem: %s} => parses',
      (problem) => {
        const drift = SpecimenDriftStub({ problem });

        const result = specimenDriftContract.parse(drift);

        expect(result.problem).toBe(problem);
      },
    );
  });

  describe('invalid drift', () => {
    it('INVALID: {problem: "moved"} => throws, since only three problems exist', () => {
      expect(() => {
        return specimenDriftContract.parse({ ...SpecimenDriftStub(), problem: 'moved' });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {relPath: ""} => throws, since a drift names a file', () => {
      expect(() => {
        return specimenDriftContract.parse({ ...SpecimenDriftStub(), relPath: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
