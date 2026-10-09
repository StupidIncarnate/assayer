/**
 * PURPOSE: Contract for ONE pure transformation between a `process.env.<X>` read and the branch
 *   operand that holds its result. A condition leaf lists these steps in the order the code applies
 *   them, so `(process.env.RECEIVER ?? '').split(',').map(Number)` is `default`, `split`, `map`.
 *
 *   Each step is one Assayer can run BACKWARDS. A case decides which value the operand must hold, and
 *   `env-encode` walks the steps in reverse to find the string to write into the environment:
 *   - `default` is `x ?? '<value>'`. It changes nothing for a variable that is set.
 *   - `number` is `Number(x)`. `String` is its inverse.
 *   - `equals` is `x === <literal>`, or `x !== <literal>` when `negated` is true. `true` inverts to the
 *     literal itself, and `false` to any value other than the literal.
 *   - `split` is `x.split('<separator>')`. A length of n inverts to n items joined by the separator.
 *   - `map` is `xs.map(f)`. It keeps the array's length, which is the only fact a case asks of it.
 *
 * USAGE:
 * envStepContract.parse({ kind: 'split', separator: ',' });
 * // Returns a validated EnvStep (branded fields)
 */
import { z } from '#gateway/npm/zod';

export const envStepContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('default'),
    value: z.string().brand<'EnvStepValue'>(),
  }).brand<'EnvStep'>(),
  z.object({
    kind: z.literal('number'),
  }).brand<'EnvStep'>(),
  z.object({
    kind: z.literal('equals'),
    literal: z.union([
      z.string().brand<'EnvStepLiteral'>(),
      z.number().brand<'EnvStepLiteral'>(),
      z.boolean(),
    ]),
    negated: z.boolean(),
  }).brand<'EnvStep'>(),
  z.object({
    kind: z.literal('split'),
    separator: z.string().min(1).brand<'EnvStepSeparator'>(),
  }).brand<'EnvStep'>(),
  z.object({
    kind: z.literal('map'),
  }).brand<'EnvStep'>(),
]);

export type EnvStep = z.infer<typeof envStepContract>;
