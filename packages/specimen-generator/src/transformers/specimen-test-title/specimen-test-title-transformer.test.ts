import { SpecimenOutcomeStub } from '../../contracts/specimen-outcome/specimen-outcome.stub';
import { specimenTestTitleTransformer } from './specimen-test-title-transformer';

describe('specimenTestTitleTransformer', () => {
  describe('branches', () => {
    it('VALID: {two branch arms driven} => names the line and arm and says driven', () => {
      const prediction = SpecimenOutcomeStub();

      const result = specimenTestTitleTransformer({ provenance: 'param', varyingLeaf: 'value', prediction });

      expect(result).toBe('VALID: {value: param} => if then on line 2 driven; if else on line 2 driven, every case passes');
    });

    it('VALID: {one branch arm driven} => names the arm and says driven', () => {
      const prediction = SpecimenOutcomeStub({ branches: [{ kind: 'ternary', arm: 'then', line: 3, driven: 'driven' }] });

      const result = specimenTestTitleTransformer({ provenance: 'const', varyingLeaf: 'limit', prediction });

      expect(result).toBe('VALID: {limit: const} => ternary then on line 3 driven, every case passes');
    });

    it('VALID: {one branch arm never driven} => says never run', () => {
      const prediction = SpecimenOutcomeStub({ branches: [{ kind: 'switch', arm: 'case-1', line: 5, driven: 'never' }] });

      const result = specimenTestTitleTransformer({ provenance: 'external', varyingLeaf: 'value', prediction });

      expect(result).toBe('VALID: {value: external} => switch case-1 on line 5 never run, every case passes');
    });

    it('VALID: {two branches given out of line order} => lists them in line order joined by semicolons', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [
          { kind: 'ternary', arm: 'then', line: 9, driven: 'driven' },
          { kind: 'if', arm: 'then', line: 2, driven: 'driven' },
        ],
      });

      const result = specimenTestTitleTransformer({ provenance: 'env', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: env} => if then on line 2 driven; ternary then on line 9 driven, every case passes',
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
        branches: [{ kind: 'if', arm: 'then', line: 2, driven: 'never' }],
        lints: [
          { rule: 'dead-surface', startLine: 7 },
          { rule: 'unreachable-exit', startLine: 4 },
        ],
      });

      const result = specimenTestTitleTransformer({ provenance: 'const', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: const} => if then on line 2 never run, unreachable-exit on line 4, dead-surface on line 7, every case passes',
      );
    });
  });

  describe('undriven', () => {
    it('VALID: {two undriven rows} => names only the earliest line', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [{ kind: 'if', arm: 'then', line: 3, driven: 'never' }],
        undriven: [{ startLine: 8 }, { startLine: 1 }],
      });

      const result = specimenTestTitleTransformer({ provenance: 'external', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: external} => if then on line 3 never run, undriven from line 1, every case passes',
      );
    });

    it('VALID: {a lint and an undriven row} => puts the lint before the undriven text', () => {
      const prediction = SpecimenOutcomeStub({
        branches: [{ kind: 'if', arm: 'then', line: 3, driven: 'never' }],
        lints: [{ rule: 'unreachable-exit', startLine: 5 }],
        undriven: [{ startLine: 2 }],
      });

      const result = specimenTestTitleTransformer({ provenance: 'external', varyingLeaf: 'value', prediction });

      expect(result).toBe(
        'VALID: {value: external} => if then on line 3 never run, unreachable-exit on line 5, undriven from line 2, every case passes',
      );
    });
  });
});
