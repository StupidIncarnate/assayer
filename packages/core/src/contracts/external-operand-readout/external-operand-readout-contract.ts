/**
 * PURPOSE: What `read-env-chain` reports for a branch operand built on one read from outside the
 *   program: the READ the chain starts from, plus the pure steps the code applies to it, in order.
 *   The read is either an environment variable (`process.env.<name>`) or a command-line entry
 *   (`process.argv[<index>]`, `process.argv.slice(<index>)`). Both share one step vocabulary, so one
 *   chain reader serves both.
 *
 *   Reach for `EnvOperandReadout` instead when only an environment read will do. `read-env-operand`
 *   narrows this readout to that one, and `read-argv-operand` narrows it to an `ArgvRead`.
 *
 * USAGE:
 * externalOperandReadoutContract.parse({ root: { kind: 'env', name: 'VALUE' }, steps: [{ kind: 'number' }] });
 * // Returns a validated ExternalOperandReadout for `Number(process.env.VALUE)`
 */
import { z } from '#gateway/npm/zod';

import { argvReadContract, envStepContract } from '@assayer/shared/contracts';

export const externalOperandReadoutContract = z
  .object({
    root: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('env'), name: z.string().min(1).brand<'ExternalOperandReadoutRootName'>() }).brand<'ExternalOperandReadoutRoot'>(),
      z
        .object({ kind: z.literal('argv'), shape: argvReadContract.shape.shape, index: argvReadContract.shape.index })
        .brand<'ExternalOperandReadoutRoot'>(),
    ]),
    steps: z.array(envStepContract),
  })
  .brand<'ExternalOperandReadout'>();

export type ExternalOperandReadout = z.infer<typeof externalOperandReadoutContract>;
