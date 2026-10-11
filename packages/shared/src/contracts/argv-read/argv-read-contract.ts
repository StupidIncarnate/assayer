/**
 * PURPOSE: Contract for a branch operand that holds a value read from `process.argv`, plus the pure
 *   steps the code applies on top of that read. A condition leaf carries it as `operandArgvRead`.
 *   Reach for it only for a command-line read. An environment read is `operandEnvVarName` plus
 *   `operandEnvSteps` instead, because a case can SET an environment variable and cannot set argv.
 *
 *   No case can steer an argv read. Its one use is the fallback arm of an un-steerable branch: Assayer
 *   knows the value an argv read holds when a case runs, so it runs the steps FORWARD to see which arm
 *   the code takes. The read has one of two shapes:
 *   - `element` is `process.argv[<index>]`, one entry.
 *   - `tail` is `process.argv.slice(<index>)`, every entry from `index` on.
 *
 *   `steps` uses the environment step vocabulary (`env-step-contract`), in the order the code applies
 *   them. It is empty when the operand holds the read itself.
 *
 * USAGE:
 * argvReadContract.parse({ shape: 'element', index: 2, steps: [{ kind: 'number' }] });
 * // Returns a validated ArgvRead for `Number(process.argv[2])`
 */
import { z } from '#gateway/npm/zod';

import { envStepContract } from '../env-step/env-step-contract';

export const argvReadContract = z
  .object({
    shape: z.enum(['element', 'tail']),
    index: z.number().int().nonnegative().brand<'ArgvReadIndex'>(),
    steps: z.array(envStepContract),
  })
  .brand<'ArgvRead'>();

export type ArgvRead = z.infer<typeof argvReadContract>;
