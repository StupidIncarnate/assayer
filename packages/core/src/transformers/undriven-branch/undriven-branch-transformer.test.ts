import { SymbolNameStub, LineNumberStub } from '@assayer/shared/contracts';

import { UndrivenCauseStub } from '../../contracts/undriven-cause/undriven-cause.stub';
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

const REASON_UNREAD_COMPARISON =
  '`pick` has a branch on line 5 that compares `m` against a value Assayer could not read as a ' +
  'literal — an enum member, an imported or computed constant, or a property of another object — so ' +
  'it has no value that satisfies the comparison and none that violates it: with nothing to vary, ' +
  'both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
  'understood the branch — this is not syntax it missed — but it cannot yet name the value on the ' +
  'other side of the comparison. Compare against a literal and each arm becomes a case Assayer drives.';

const REASON_WITH_OPERAND_PICK =
  '`pick` has a branch on line 4 whose deciding value `u` is neither one of its parameters nor an ' +
  'environment variable, so no case can steer which arm runs: with nothing to vary, both arms would ' +
  'arrange the same inputs and one would fail against correct code. Assayer understood the branch — ' +
  'this is not syntax it missed — but its execution model cannot set the value that decides it. Make ' +
  'the deciding value a parameter, or read it from the environment in a module scope, and each arm ' +
  'becomes a case Assayer drives.';

const REASON_TYPEOF =
  '`checkTypeof` has a branch on line 3 whose deciding value is a `typeof` read, so no case can steer ' +
  'which arm runs: with nothing to vary, both arms would arrange the same inputs and one would fail ' +
  'against correct code. Assayer understood the branch — this is not syntax it missed — but it does ' +
  'not decompose a `typeof` comparison into the case each result names; the value `typeof` narrows ' +
  'may already be a parameter this entry declares.';

const REASON_PROPERTY_DEPTH =
  '`checkDeep` has a branch on line 4 whose deciding value `config.db.retry.backoff` reads a property ' +
  'more than one level deep off one of its parameters, so no case can steer which arm runs: with ' +
  'nothing to vary, both arms would arrange the same inputs and one would fail against correct code. ' +
  'Assayer understood the branch — this is not syntax it missed — but it matches an object-member ' +
  'comparison only ONE property level deep (`config.mode`), never a path this long.';

describe('undrivenBranchTransformer', () => {
  describe('an opaque-call branch with no nameable operand', () => {
    it('VALID: {a branch on line 3, no operand} => one admission spanning that line, reason omits the operand', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'opaqueIf' }),
        undrivenBranches: [{ line: LineNumberStub({ value: 3 }), cause: UndrivenCauseStub() }],
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
        undrivenBranches: [
          {
            line: LineNumberStub({ value: 4 }),
            cause: UndrivenCauseStub(),
            operand: SymbolNameStub({ value: 'u' }),
          },
        ],
      });

      expect(result).toStrictEqual([
        { name: 'nonParam', startLine: 4, endLine: 4, reason: REASON_WITH_OPERAND },
      ]);
    });
  });

  describe('a param compared against a value the parse could not read', () => {
    it('VALID: {a branch on line 5 comparing `m`} => the reason names the comparison, never the parameter', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'pick' }),
        undrivenBranches: [
          {
            line: LineNumberStub({ value: 5 }),
            cause: UndrivenCauseStub({ value: 'unread-comparison' }),
            operand: SymbolNameStub({ value: 'm' }),
          },
        ],
      });

      expect(result).toStrictEqual([
        { name: 'pick', startLine: 5, endLine: 5, reason: REASON_UNREAD_COMPARISON },
      ]);
    });

    // No real producer sends `unread-comparison` without an operand — every leaf that reaches this cause
    // already passed the arrangeable check, and every arrangeable route (plain param, env, welded const)
    // resolves through the same identifier node `operandParamName` is read off. The invariant check pins
    // that as a hard failure rather than a silently-omitted operand, so a future producer that broke it
    // would fail loudly instead of printing a reason with a hole in it.
    it('ERROR: {a branch on line 5, no operand, cause unread-comparison} => throws the invariant violation', () => {
      expect(() =>
        undrivenBranchTransformer({
          entryName: SymbolNameStub({ value: 'pick' }),
          undrivenBranches: [{ line: LineNumberStub({ value: 5 }), cause: UndrivenCauseStub({ value: 'unread-comparison' }) }],
        }),
      ).toThrow(/^unreachable: an 'unread-comparison' branch on line 5 of `pick` carries no operand$/u);
    });
  });

  describe('a typeof-narrowed branch', () => {
    it('VALID: {a branch on line 3 narrowing typeof} => the reason names the typeof limit, never "make it a parameter"', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'checkTypeof' }),
        undrivenBranches: [{ line: LineNumberStub({ value: 3 }), cause: UndrivenCauseStub({ value: 'unarrangeable-typeof' }) }],
      });

      expect(result).toStrictEqual([
        { name: 'checkTypeof', startLine: 3, endLine: 3, reason: REASON_TYPEOF },
      ]);
    });
  });

  describe('an object-member branch reading a property more than one segment deep', () => {
    it('VALID: {a branch on line 4 deciding on `config.db.retry.backoff`} => the reason names the depth limit, never "make it a parameter"', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'checkDeep' }),
        undrivenBranches: [
          {
            line: LineNumberStub({ value: 4 }),
            cause: UndrivenCauseStub({ value: 'unarrangeable-property-depth' }),
            operand: SymbolNameStub({ value: 'config.db.retry.backoff' }),
          },
        ],
      });

      expect(result).toStrictEqual([
        { name: 'checkDeep', startLine: 4, endLine: 4, reason: REASON_PROPERTY_DEPTH },
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

  describe('an entry with more than one un-steerable branch', () => {
    // Two branches, two different causes, on the SAME entry: the map has to keep both admissions, in
    // order, each reasoned independently — one entry owing several branches is not collapsed to its
    // first.
    it('VALID: {branches on line 4 and line 5, different causes} => one admission per branch, in order', () => {
      const result = undrivenBranchTransformer({
        entryName: SymbolNameStub({ value: 'pick' }),
        undrivenBranches: [
          { line: LineNumberStub({ value: 4 }), cause: UndrivenCauseStub(), operand: SymbolNameStub({ value: 'u' }) },
          {
            line: LineNumberStub({ value: 5 }),
            cause: UndrivenCauseStub({ value: 'unread-comparison' }),
            operand: SymbolNameStub({ value: 'm' }),
          },
        ],
      });

      expect(result).toStrictEqual([
        { name: 'pick', startLine: 4, endLine: 4, reason: REASON_WITH_OPERAND_PICK },
        { name: 'pick', startLine: 5, endLine: 5, reason: REASON_UNREAD_COMPARISON },
      ]);
    });
  });
});
