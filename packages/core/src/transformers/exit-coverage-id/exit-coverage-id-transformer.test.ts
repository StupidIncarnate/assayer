import { GuardStepStub, SymbolNameStub } from '@assayer/shared/contracts';

import { exitCoverageIdTransformer } from './exit-coverage-id-transformer';

const CLASSIFY_SCOPE = [SymbolNameStub({ value: 'classify' })];
const NESTED_SCOPE = [SymbolNameStub({ value: 'Classifier' }), SymbolNameStub({ value: 'classify' })];

describe('exitCoverageIdTransformer', () => {
  describe('an exit no branch guards', () => {
    it('EMPTY: {empty guard path} => the kind keyed @top', () => {
      expect(exitCoverageIdTransformer({ kind: 'return', guardPath: [], scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@top',
      );
    });

    it('EMPTY: {empty guard path, nested scope} => the whole scope path keyed @top', () => {
      expect(exitCoverageIdTransformer({ kind: 'exit', guardPath: [], scopePath: NESTED_SCOPE })).toBe(
        'Classifier/classify/exit@top',
      );
    });

    it('EMPTY: {empty guard path, empty scope path} => the segment alone', () => {
      expect(exitCoverageIdTransformer({ kind: 'return', guardPath: [], scopePath: [] })).toBe('return@top');
    });
  });

  describe('a guarded exit names the BRANCHES crossed, not just the arms taken', () => {
    it('VALID: {one guard step} => the branch id with its arm, scope prefix stripped', () => {
      const guardPath = [GuardStepStub({ branchCoverageId: 'classify/if:id:value', arm: 'then' })];

      expect(exitCoverageIdTransformer({ kind: 'return', guardPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@if:id:value#then',
      );
    });

    it('VALID: {two guard steps} => both steps joined by a slash, in order', () => {
      const guardPath = [
        GuardStepStub({ branchCoverageId: 'classify/if:id:a', arm: 'then' }),
        GuardStepStub({ branchCoverageId: 'classify/if:id:b', arm: 'else' }),
      ];

      expect(exitCoverageIdTransformer({ kind: 'throw', guardPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/throw@if:id:a#then/if:id:b#else',
      );
    });

    it('VALID: {nested scope} => the nested prefix is stripped from the step, since the id carries it once', () => {
      const guardPath = [GuardStepStub({ branchCoverageId: 'Classifier/classify/if:id:value', arm: 'then' })];

      expect(exitCoverageIdTransformer({ kind: 'return', guardPath, scopePath: NESTED_SCOPE })).toBe(
        'Classifier/classify/return@if:id:value#then',
      );
    });

    it('EDGE: {step whose branch id does NOT carry the scope prefix} => that id is kept whole', () => {
      const guardPath = [GuardStepStub({ branchCoverageId: 'other/if:id:value', arm: 'then' })];

      expect(exitCoverageIdTransformer({ kind: 'return', guardPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@other/if:id:value#then',
      );
    });
  });

  describe('two exits in one scope cannot collide', () => {
    it('VALID: {two then-returns behind DIFFERENT branches} => different ids, so the diff can tell them apart', () => {
      const firstPath = [
        GuardStepStub({ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5', arm: 'then' }),
      ];
      const secondPath = [
        GuardStepStub({ branchCoverageId: 'classify/if:BinaryExpression,id:value,GreaterThanToken,num:1', arm: 'then' }),
      ];

      expect(exitCoverageIdTransformer({ kind: 'return', guardPath: firstPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:5#then',
      );
      expect(exitCoverageIdTransformer({ kind: 'return', guardPath: secondPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@if:BinaryExpression,id:value,GreaterThanToken,num:1#then',
      );
    });

    it('VALID: {the same branch taken then vs else} => different ids', () => {
      const thenPath = [GuardStepStub({ branchCoverageId: 'classify/if:id:value', arm: 'then' })];
      const elsePath = [GuardStepStub({ branchCoverageId: 'classify/if:id:value', arm: 'else' })];

      expect(exitCoverageIdTransformer({ kind: 'return', guardPath: thenPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@if:id:value#then',
      );
      expect(exitCoverageIdTransformer({ kind: 'return', guardPath: elsePath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@if:id:value#else',
      );
    });

    it('VALID: {a return and a throw behind one guard} => different ids, since the kind is part of the segment', () => {
      const guardPath = [GuardStepStub({ branchCoverageId: 'classify/if:id:value', arm: 'then' })];

      expect(exitCoverageIdTransformer({ kind: 'return', guardPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/return@if:id:value#then',
      );
      expect(exitCoverageIdTransformer({ kind: 'throw', guardPath, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/throw@if:id:value#then',
      );
    });
  });
});
