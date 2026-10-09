/**
 * PURPOSE: What `read-env-operand` reports when a branch operand holds a value read from the process
 *   environment: the variable's NAME, and the pure STEPS the code applies to the raw string before
 *   the operand holds it, in order. The leaf builders copy it onto the leaf as `operandEnvVarName` and
 *   `operandEnvSteps`. Reach for it only for an environment read. A welded constant is a
 *   `ConstOperandReadout` instead.
 *
 * USAGE:
 * envOperandReadoutContract.parse({ name: 'VALUE', steps: [{ kind: 'number' }] });
 * // Returns a validated EnvOperandReadout for `const value = Number(process.env.VALUE)`
 */
import { z } from '#gateway/npm/zod';

import { envStepContract } from '@assayer/shared/contracts';

export const envOperandReadoutContract = z
  .object({
    name: z.string().min(1).brand<'EnvOperandReadoutName'>(),
    steps: z.array(envStepContract),
  })
  .brand<'EnvOperandReadout'>();

export type EnvOperandReadout = z.infer<typeof envOperandReadoutContract>;
