import { specimenOutcomeContract } from './specimen-outcome-contract';
import { SpecimenOutcomeStub } from './specimen-outcome.stub';

describe('specimenOutcomeContract', () => {
  describe('valid outcomes', () => {
    it('VALID: {stub default} => parses two branch arms driven and nothing else', () => {
      const outcome = SpecimenOutcomeStub();

      const result = specimenOutcomeContract.parse(outcome);

      expect(result).toStrictEqual({
        branches: [
          { kind: 'if', arm: 'then', line: 2, driven: 'driven' },
          { kind: 'if', arm: 'else', line: 2, driven: 'driven' },
        ],
        caseFailures: [],
        lints: [],
        undriven: [],
        darkSpots: [],
        gaps: [],
      });
    });

    it('VALID: {every list filled} => parses every row', () => {
      const outcome = SpecimenOutcomeStub({
        branches: [{ kind: 'ternary', arm: 'else', line: 3, driven: 'never' }] as never,
        caseFailures: [{ status: 'errored', message: 'boom' }] as never,
        lints: [{ rule: 'unreachable-exit', startLine: 5 }] as never,
        undriven: [{ startLine: 1 }] as never,
        darkSpots: [{ startLine: 4 }] as never,
        gaps: [{ name: 'value' }] as never,
      });

      const result = specimenOutcomeContract.parse(outcome);

      expect(result).toStrictEqual({
        branches: [{ kind: 'ternary', arm: 'else', line: 3, driven: 'never' }],
        caseFailures: [{ status: 'errored', message: 'boom' }],
        lints: [{ rule: 'unreachable-exit', startLine: 5 }],
        undriven: [{ startLine: 1 }],
        darkSpots: [{ startLine: 4 }],
        gaps: [{ name: 'value' }],
      });
    });
  });

  describe('invalid outcomes', () => {
    it('INVALID: {branches: [{kind: "loop"}]} => throws, since only if, switch and ternary exist', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          branches: [{ kind: 'loop', arm: 'then', line: 2, driven: 'driven' }],
        });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {branches: [{arm: ""}]} => throws, since arm needs at least one character', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          branches: [{ kind: 'if', arm: '', line: 2, driven: 'driven' }],
        });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {branches: [{line: 0}]} => throws, since lines start at 1', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          branches: [{ kind: 'if', arm: 'then', line: 0, driven: 'driven' }],
        });
      }).toThrow(/Too small: expected number to be >0/u);
    });

    it('INVALID: {branches: [{driven: "twice"}]} => throws, since driven has two values', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          branches: [{ kind: 'if', arm: 'then', line: 2, driven: 'twice' }],
        });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {caseFailures: [{status: "passed"}]} => throws, since only failed and errored exist', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          caseFailures: [{ status: 'passed', message: 'x' }],
        });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {caseFailures: [{message: missing}]} => throws, since a failure carries its message', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          caseFailures: [{ status: 'failed' }],
        });
      }).toThrow(/expected string, received undefined/u);
    });

    it('INVALID: {lints: [{rule: "made-up"}]} => throws, since only declared rules exist', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          lints: [{ rule: 'made-up', startLine: 2 }],
        });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {lints: [{startLine: 1.5}]} => throws, since lines are whole numbers', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          lints: [{ rule: 'dead-surface', startLine: 1.5 }],
        });
      }).toThrow(/Invalid input: expected int, received number/u);
    });

    it('INVALID: {undriven: [{startLine: 0}]} => throws, since lines start at 1', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          undriven: [{ startLine: 0 }],
        });
      }).toThrow(/Too small: expected number to be >0/u);
    });

    it('INVALID: {darkSpots: [{startLine: -3}]} => throws, since lines start at 1', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          darkSpots: [{ startLine: -3 }],
        });
      }).toThrow(/Too small: expected number to be >0/u);
    });

    it('INVALID: {gaps: [{name: ""}]} => throws, since a gap needs a name', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          ...SpecimenOutcomeStub(),
          gaps: [{ name: '' }],
        });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {branches: missing} => throws, since every list is required', () => {
      expect(() => {
        return specimenOutcomeContract.parse({
          caseFailures: [],
          lints: [],
          undriven: [],
          darkSpots: [],
          gaps: [],
        });
      }).toThrow(/expected array, received undefined/u);
    });
  });
});
