/**
 * PURPOSE: Answers whether one read of an environment variable is met ONLY by leaving the variable
 *   unset: a test that wants the operand nullish (`=== undefined`, the `??` operand falling through),
 *   on a chain where nullish means unset and nothing else (`is-env-steps-nullable`). A set variable
 *   reaches such an operand as a string, or as what the steps build from one, and neither is ever
 *   nullish.
 *
 *   `env-solve` asks it to PROVE a case impossible. One read that needs the variable unset, beside
 *   another read that an unset variable fails, cannot both hold in one case. Any weaker reason to give
 *   up on a case is not a proof, and does not call an exit unreachable.
 *
 * USAGE:
 * isEnvUnsetOnlyGuard({ steps: [], predicate: { kind: 'undefined-eq' }, want: true });
 * // Returns true — `process.env.V === undefined` holds only when V is unset
 */
import type { EnvStep, Predicate } from '@assayer/shared/contracts';

import { isEnvStepsNullableGuard } from '../is-env-steps-nullable/is-env-steps-nullable-guard';

export const isEnvUnsetOnlyGuard = ({
  steps,
  predicate,
  want,
}: {
  steps?: readonly EnvStep[];
  predicate?: Predicate;
  want?: boolean;
}): boolean => {
  if (steps === undefined || predicate === undefined || want === undefined || !isEnvStepsNullableGuard({ steps })) {
    return false;
  }

  return (
    (predicate.kind === 'undefined-eq' && want) ||
    (predicate.kind === 'undefined-neq' && !want) ||
    (predicate.kind === 'non-nullish' && !want)
  );
};
