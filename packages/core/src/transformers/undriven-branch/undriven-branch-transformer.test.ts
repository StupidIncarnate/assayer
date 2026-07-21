import { SymbolNameStub, LineNumberStub } from '@assayer/shared/contracts';

import { undrivenBranchTransformer } from './undriven-branch-transformer';

const REASON_NO_OPERAND =
  '`opaqueIf` has a branch on line 3 whose deciding value is neither one of its parameters nor an ' +
  'environment variable, so no case can steer which arm runs: with nothing to vary, both arms would ' +
  'arrange the same inputs and one would fail against correct code. Assayer understood the branch — ' +
  'this is not syntax it missed — but its execution model cannot set the value that decides it. Make ' +
  'the deciding value a parameter, or read it from the environment in a module scope, and each arm ' +
  'becomes a case Assayer drives.';

const REASON_WITH_OPERAND =
  '`nonParam` has a branch on line 4 whose deciding value `u` is neither one of its parameters nor an ' +
  'environment variable, so no case can steer which arm runs: with nothing to vary, both arms would ' +
  'arrange the same inputs and one would fail against correct code. Assayer understood the branch — ' +
  'this is not syntax it missed — but its execution model cannot set the value that decides it. Make ' +
  'the deciding value a parameter, or read it from the environment in a module scope, and each arm ' +
  'becomes a case Assayer drives.';

describe('undrivenBranchTransformer', () => {
  describe('an opaque-call branch with no nameable operand', () => {
    it('VALID: {a branch on line 3, no operand} => one admission spanning that line, reason omits the operand', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'opaqueIf' }),
        undrivenBranches: [{ line: LineNumberStub({ value: 3 }) }],
      });

      expect(result).toStrictEqual([
        { name: 'opaqueIf', startLine: 3, endLine: 3, reason: REASON_NO_OPERAND },
      ]);
    });
  });

  describe('a non-param local branch with a nameable operand', () => {
    it('VALID: {a branch on line 4 deciding on `u`} => the admission names the operand in its reason', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'nonParam' }),
        undrivenBranches: [{ line: LineNumberStub({ value: 4 }), operand: SymbolNameStub({ value: 'u' }) }],
      });

      expect(result).toStrictEqual([
        { name: 'nonParam', startLine: 4, endLine: 4, reason: REASON_WITH_OPERAND },
      ]);
    });
  });

  describe('an entry with no un-steerable branch', () => {
    it('EMPTY: {no undriven branches} => no admissions', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'classify' }),
        undrivenBranches: [],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
