/**
 * PURPOSE: What `env-solve` decides for ONE environment variable in one case: the string to write
 *   (`set`), leaving it unset (`unset`), no string any operand could encode so no binding at all
 *   (`unencodable`), candidates that each miss some read so the case is dropped (`unsolved`), or reads
 *   that provably contradict each other so the case is impossible (`unreachable`). `cause-arrange`
 *   turns each into an arrange binding, no binding, or the cause's own outcome.
 *
 *   `unsolved` and `unreachable` are two different answers on purpose. `unreachable` is a proof, and
 *   it can make an exit an unreachable-exit lint. `unsolved` only says the candidates tried did not
 *   work, so it drops the case without claiming anything about the code.
 *
 * USAGE:
 * envSolutionContract.parse({ kind: 'set', value: '7' });
 * // Returns a validated EnvSolution
 */
import { z } from '#gateway/npm/zod';

export const envSolutionContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('set'), value: z.string().brand<'EnvSolutionValue'>() }).brand<'EnvSolution'>(),
  z.object({ kind: z.literal('unset') }).brand<'EnvSolution'>(),
  z.object({ kind: z.literal('unencodable') }).brand<'EnvSolution'>(),
  z.object({ kind: z.literal('unsolved') }).brand<'EnvSolution'>(),
  z.object({ kind: z.literal('unreachable') }).brand<'EnvSolution'>(),
]);

export type EnvSolution = z.infer<typeof envSolutionContract>;
