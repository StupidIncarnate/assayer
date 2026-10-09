/**
 * PURPOSE: The name `cause-arrange` keys one leaf's operand by, so every leaf that tests the same value
 *   narrows one domain. A parameter or a welded constant is keyed by its name. An environment read is
 *   keyed by the read and its steps (`env-operand-key`), never by the `const` that holds it, because two
 *   bindings of one chain hold the same value, and a read written in place has no binding at all.
 *
 * USAGE:
 * operandKeyTransformer({ leaf });
 * // Returns 'score' for a parameter, 'Number(process.env.VALUE)' for `const value = Number(process.env.VALUE)`
 */
import type { ConditionLeaf } from '@assayer/shared/contracts';

import { envOperandKeyTransformer } from '../env-operand-key/env-operand-key-transformer';

export const operandKeyTransformer = ({ leaf }: { leaf: ConditionLeaf }): string | undefined =>
  leaf.operandEnvVarName === undefined
    ? leaf.operandParamName === undefined
      ? undefined
      : String(leaf.operandParamName)
    : envOperandKeyTransformer({ name: String(leaf.operandEnvVarName), steps: leaf.operandEnvSteps ?? [] });
