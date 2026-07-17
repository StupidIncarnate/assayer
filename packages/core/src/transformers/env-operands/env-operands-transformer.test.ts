import { BranchNodeStub, ConditionLeafStub } from '@assayer/shared/contracts';

import { envOperandsTransformer } from './env-operands-transformer';

const ENV_BRANCH = BranchNodeStub({
  coverageId: 'm/if:value',
  condition: ConditionLeafStub({
    id: 'm/if:value#leaf',
    operandParamName: 'value',
    operandEnvVarName: 'VALUE',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  }),
});

// The hardcoded-const shape: an operand welded to a literal in the source, so nothing varies.
const WELDED_BRANCH = BranchNodeStub({
  coverageId: 'm/if:welded',
  condition: ConditionLeafStub({
    id: 'm/if:welded#leaf',
    operandParamName: 'value',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  }),
});

describe('envOperandsTransformer', () => {
  describe('branches decided by the environment', () => {
    it('VALID: {a leaf naming an env var} => that variable', () => {
      expect(envOperandsTransformer({ branches: [ENV_BRANCH] })).toStrictEqual(['VALUE']);
    });

    it('VALID: {a compound condition over two env vars} => both, in first-seen order', () => {
      const branch = BranchNodeStub({
        coverageId: 'm/if:and',
        condition: {
          kind: 'and',
          left: ConditionLeafStub({
            id: 'm/if:and#leaf.0',
            operandParamName: 'port',
            operandEnvVarName: 'PORT',
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 0 },
          }),
          right: ConditionLeafStub({
            id: 'm/if:and#leaf.1',
            operandParamName: 'retries',
            operandEnvVarName: 'RETRIES',
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 1 },
          }),
        },
      });

      expect(envOperandsTransformer({ branches: [branch] })).toStrictEqual(['PORT', 'RETRIES']);
    });

    // Deduped, because the answer is "which variables", not "how many leaves read one". Two leaves
    // over one variable is one input to set.
    it('VALID: {two branches reading the same var} => named once', () => {
      expect(envOperandsTransformer({ branches: [ENV_BRANCH, ENV_BRANCH] })).toStrictEqual(['VALUE']);
    });
  });

  describe('branches nothing can vary', () => {
    // The pure-statement rung, and the whole reason this question exists: an empty answer is what
    // makes the case set decline the entry and the undriven projection admit it.
    it('VALID: {an operand welded to a source literal} => nothing, so nothing can drive it', () => {
      expect(envOperandsTransformer({ branches: [WELDED_BRANCH] })).toStrictEqual([]);
    });

    it('EMPTY: {no branches} => nothing', () => {
      expect(envOperandsTransformer({ branches: [] })).toStrictEqual([]);
    });
  });
});
