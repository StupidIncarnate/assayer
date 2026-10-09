import { SpecimenOutcomeStub } from '../../contracts/specimen-outcome/specimen-outcome.stub';
import { specimenTestTitleTransformer } from './specimen-test-title-transformer';

describe('specimenTestTitleTransformer', () => {
  describe('branches', () => {
    it('VALID: {one branch driven both ways} => names the line and says driven both ways', () => {
      const prediction = SpecimenOutcomeStub();

      const result = specimenTestTitleTransformer({ provenance: 'param', varyingLeaf: 'value', prediction });

      expect(result).toBe('VALID: {value: param} => if on line 2 driven both ways, every case passes');
    });

    it('VALID: {one branch driven one way} => says locked one way', () => {
      const prediction = SpecimenOutcomeStub({ branches: [{ kind: 'ternary', line: 3, driven: 'one-way' }] });

      const result = specimenTestTitleTransformer({ provenance: 'const', varyingLeaf: 'limit', prediction });

      expect(result).toBe('VALID: {limit: const} => ternary on line 3 locked one way, every case passes');
    });

    it('VALID: {one branch never driven} => says never run', () => {
      const prediction = SpecimenOutcomeStub({ branches: [{ kind: 'switch', line: 5, driven: 'never' }] });

      const result = specimenTestTitleTransformer({ provenance: 'external', varyingLeaf: 'value', prediction });

      expect(result).toBe('VALID: {value: external} => switch on line 5 never run, every case passes');
    });

    it('VALID: {two branches given out of line order} => lists them in line order joined by semicolons', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [
          { kind: 'ternary', line: 9, driven: 'one-way' },
          { kind: 'if', line: 2, driven: 'both-ways' },
        ],
      });

      const result = specimenTestTitleTransformer({ provenance: 'env', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: env} => if on line 2 driven both ways; ternary on line 9 locked one way, every case passes',
      );
    });

    it('EMPTY: {no branches} => leaves out the branch text', () => {
      const prediction = SpecimenOutcomeStub({ branches: [] });

      const result = specimenTestTitleTransformer({ provenance: 'literal', varyingLeaf: 'value', prediction });

      expect(result).toBe('VALID: {value: literal} => every case passes');
    });
  });

  describe('lints', () => {
    it('VALID: {two lints given out of line order} => adds each one after the branches in line order', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [{ kind: 'if', line: 2, driven: 'one-way' }],
        lints: [
          { rule: 'dead-surface', startLine: 7 },
          { rule: 'unreachable-exit', startLine: 4 },
        ],
      });

      const result = specimenTestTitleTransformer({ provenance: 'const', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: const} => if on line 2 locked one way, unreachable-exit on line 4, dead-surface on line 7, every case passes',
      );
    });
  });

  describe('undriven', () => {
    it('VALID: {two undriven rows} => names only the earliest line', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [{ kind: 'if', line: 3, driven: 'never' }],
        undriven: [{ startLine: 8 }, { startLine: 1 }],
      });

      const result = specimenTestTitleTransformer({ provenance: 'external', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: external} => if on line 3 never run, undriven from line 1, every case passes',
      );
    });

    it('VALID: {a lint and an undriven row} => puts the lint before the undriven text', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [{ kind: 'if', line: 3, driven: 'never' }],
        lints: [{ rule: 'unreachable-exit', startLine: 5 }],
        undriven: [{ startLine: 2 }],
      });

      const result = specimenTestTitleTransformer({ provenance: 'external', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: external} => if on line 3 never run, unreachable-exit on line 5, undriven from line 2, every case passes',
      );
    });
  });
});
